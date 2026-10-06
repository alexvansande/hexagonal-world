"""Optimise one v2 configuration (scaffold formulation).
usage: python3 -I v2_run.py N OUTSIDE ERODE LAND_EPS AREA_BETA ITERS TAG [INIT_TAG]"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import v2_core as v
import fishmap as fm

n, outside, erode, eps, beta, iters, tag = (int(sys.argv[1]), sys.argv[2], int(sys.argv[3]), float(sys.argv[4]),
                                            float(sys.argv[5]), int(sys.argv[6]), sys.argv[7])
EPS_OUT = eps / 10      # outside-region scaffold: conformal term only, 10x cheaper than other land
HERE = os.path.dirname(os.path.abspath(__file__))
t0 = time.time()
M = v.Mesh(n)
fo, fw, fe, forced = v.classify(M)
d = v.build_scaffold(M, fo, forced, outside, erode)
PROLONG = os.environ.get('V2_PROLONG')   # "TAG:N" of a coarser run to start from
if PROLONG:
    ctag, cn = PROLONG.split(':'); cn = int(cn)
    Mc = v.Mesh(cn)
    Zc = np.load(os.path.join(HERE, f'v2-run-{ctag}.npz'))
    cpos = {c: i for i, c in enumerate(Zc['cid'])}
    cinv = {g: i for i, g in enumerate(Zc['vid'])}
    ccells, clam = Mc.locate(M.pos)
    vbad = np.array([c not in cpos for c in ccells])
    # grow the cap so that every remaining fine vertex lies in a coarse mesh triangle
    d['cap'] = d['cap'] | vbad[M.cells].any(1)
    assert not (d['cap'] & d['dom']).any()
mesh_cells = ~d['cap']
cid, tri, vpos = v.make_tri(M, mesh_cells, None)
topo = v.topology(tri)
print(topo, flush=True)
wo = np.maximum(fo, forced * 1.0)            # strait/route cells count as water
# coastal buffer: a land cell touching water gets a share of its wettest
# neighbour's weight, so narrow seas are not crushed by free land around them
BUF = float(os.environ.get('V2_BUFFER', '0.5'))
wn = np.zeros(M.C)
for c in range(M.C):
    wn[c] = max(wo[d] for vv in M.cells[c] for d in M.vcells[vv])
wo_eff = np.maximum(wo, BUF * wn)
wc = np.where(d['dom'], wo_eff + eps, EPS_OUT)
wa = np.where(d['dom'], beta * (wo_eff + eps), 0.0)
P = v.Problem(M, cid, tri, vpos, wc, wa)
P.power = float(os.environ.get('V2_POWER', '2'))
show = d['dom'][cid]
x0 = v.laea_init(M, P, M.cent[d['pole']])
if PROLONG:
    xc = Zc['x']; ctri = Zc['tri']
    xp = np.zeros((P.nv, 2))
    for k, g in enumerate(P.vid):
        c = ccells[g]; t = ctri[cpos[c]]
        xp[k] = clam[g] @ xc[[cinv[int(u)] for u in t]]
    Dp = np.linalg.det(P.J(xp)[1])
    print('prolongation flips', int((Dp <= 0).sum()), flush=True)
    # repair: local untangling of the few inverted (land) triangles
    xp, nit = v.untangle(P, xp)
    Dp = np.linalg.det(P.J(xp)[1])
    print('flips after untangling', int((Dp <= 0).sum()), 'iterations', nit, flush=True)
    if (Dp > 0).all():
        x0 = xp
Ds, J = P.J(x0)
print('initial flipped', int((np.linalg.det(J) <= 0).sum()), flush=True)
if len(sys.argv) > 8:  # warm start from an earlier run on the same mesh
    Z0 = np.load(os.path.join(HERE, f'v2-run-{sys.argv[8]}.npz'))
    assert (Z0['vid'] == P.vid).all() and (Z0['tri'] == tri).all()
    x0 = Z0['x']
x, E, it = v.lbfgs(P, x0, iters=iters, log=lambda s: print(s, flush=True), every=500)
m, om, ar = v.metrics(M, P, x, fo, forced, show)
inj, rim = v.injectivity(M, P, x)
# display boundary (edge of the outside region) and water along it
sub = v.Problem(M, cid[show], tri[show], vpos, wc, wa)
loop_sub, nb = v.boundary_polygon(M, sub)
loop = np.array([np.nonzero(P.vid == g)[0][0] for g in sub.vid[loop_sub]])
t = (np.arange(9) + 0.5) / 9
S = P.X[loop][:, None] + t[None, :, None] * (P.X[np.roll(loop, -1)] - P.X[loop])[:, None]
S /= np.linalg.norm(S, axis=2, keepdims=True)
r, c = fm.pix(S.reshape(-1, 3))
bwater = fm.masks()[0][r, c].reshape(len(loop), 9).mean(1)
res = dict(n=n, energy_power=P.power, coastal_buffer=BUF, prolonged_from=PROLONG, outside=outside, erode=erode, land_eps=eps, outside_eps=EPS_OUT, area_beta=beta, iterations=it,
           energy=E, topology_optimisation_mesh=topo, display_boundary_edges=int(nb),
           display_boundary_single_loop=bool(nb == len(loop)),
           outside_area_Mkm2=float(M.sph_area[d['R']].sum() * fm.R_KM ** 2 / 1e6),
           cap_cells=int(d['cap'].sum()), pole_depth_cells=d['pole_depth_cells'],
           enclosed_ocean_km2=float((fo * M.sph_area * d['enclosed']).sum() * fm.R_KM ** 2),
           ocean_km2_in_outside=float((fo * M.sph_area * d['R']).sum() * fm.R_KM ** 2),
           display_boundary_edges_with_water=int((bwater > 0).sum()),
           display_boundary_max_water_fraction=float(bwater.max()),
           metrics=m, injectivity_whole_mesh=inj, seconds=time.time() - t0)
print(json.dumps(res, indent=1), flush=True)
json.dump(res, open(os.path.join(HERE, f'v2-run-{tag}.json'), 'w'), indent=1)
np.savez(os.path.join(HERE, f'v2-run-{tag}.npz'), x=x, cid=cid, tri=tri, vpos=vpos, vid=P.vid, loop=loop, rim=rim,
         show=show, omega=om, area=ar)
