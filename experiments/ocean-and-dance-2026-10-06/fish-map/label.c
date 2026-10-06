/* 4-connected labelling of ocean pixels (value 0) in a W x H uint8 mask, wrapping in longitude.
   Output: int32 labels (0 = land, 1.. = water components, ordered by discovery). */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
int main(int argc,char**argv){
  int W=atoi(argv[3]),H=atoi(argv[4]); long N=(long)W*H;
  uint8_t*m=malloc(N); FILE*f=fopen(argv[1],"rb"); fread(m,1,N,f); fclose(f);
  int32_t*L=calloc(N,4); long*q=malloc(N*sizeof(long)); int lab=0;
  for(long s=0;s<N;s++){ if(m[s]||L[s]) continue; lab++; long h=0,t=0; q[t++]=s; L[s]=lab;
    while(h<t){ long p=q[h++]; int y=p/W,x=p%W; long nb[4]; int k=0;
      nb[k++]=y*(long)W+(x+1)%W; nb[k++]=y*(long)W+(x+W-1)%W;
      if(y>0) nb[k++]=p-W; if(y<H-1) nb[k++]=p+W;
      for(int i=0;i<k;i++){ long r=nb[i]; if(!m[r]&&!L[r]){L[r]=lab;q[t++]=r;} } } }
  f=fopen(argv[2],"wb"); fwrite(L,4,N,f); fclose(f); fprintf(stderr,"%d components\n",lab); return 0; }
