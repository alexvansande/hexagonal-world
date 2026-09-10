// Deterministic search of continents.png: 1,500 initial rotations per distance, then dense validation on the same objective.
export const searchPresets = {
  "tetra": {
    "infinite": {
      "config": {
        "method": "tetra",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "all-hex-edges",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -42.03932575508952,
            "lat": -70.24307779596023,
            "roll": -62.77504002302885
          },
          "before": 0.3426270855783096,
          "after": 0.09292448917465145,
          "evaluations": 2164,
          "samples": 24576
        },
        {
          "distance": 1,
          "angles": {
            "lon": 142.2335620466621,
            "lat": 69.19926940568894,
            "roll": -122.74861186332998
          },
          "before": 0.40548237643892043,
          "after": 0.15212276846664793,
          "evaluations": 2188,
          "samples": 24576
        },
        {
          "distance": 2,
          "angles": {
            "lon": -22.47614520862703,
            "lat": 26.40496666616366,
            "roll": -144.0028911352158
          },
          "before": 0.46447397551707104,
          "after": 0.20051696848890568,
          "evaluations": 2182,
          "samples": 24576
        },
        {
          "distance": 3,
          "angles": {
            "lon": 88.53302932754173,
            "lat": 32.01039827508441,
            "roll": -128.15418743044137
          },
          "before": 0.512087022163415,
          "after": 0.2300902521917324,
          "evaluations": 2176,
          "samples": 24576
        },
        {
          "distance": 4,
          "angles": {
            "lon": 87.33302932754157,
            "lat": 31.260398275084412,
            "roll": -126.4291874304414
          },
          "before": 0.5661307104191756,
          "after": 0.2557532089148946,
          "evaluations": 2194,
          "samples": 24576
        },
        {
          "distance": 5,
          "angles": {
            "lon": -94.06767230406405,
            "lat": -31.052531500268458,
            "roll": -54.84680949747559
          },
          "before": 0.613283136895857,
          "after": 0.28624701784816137,
          "evaluations": 2182,
          "samples": 24576
        },
        {
          "distance": 6,
          "angles": {
            "lon": -12.069630381837442,
            "lat": -11.36912602667553,
            "roll": -108.85238017402588
          },
          "before": 0.659371164752585,
          "after": 0.31903941059408497,
          "evaluations": 2230,
          "samples": 24576
        },
        {
          "distance": 7,
          "angles": {
            "lon": -97.94287533201276,
            "lat": 19.784305687089272,
            "roll": -11.50990578196945
          },
          "before": 0.7245910624121707,
          "after": 0.3519436825271672,
          "evaluations": 2206,
          "samples": 24576
        },
        {
          "distance": 8,
          "angles": {
            "lon": -25.264457853510976,
            "lat": -17.355383675561143,
            "roll": -106.59311699084935
          },
          "before": 0.775339103186523,
          "after": 0.3820537895589091,
          "evaluations": 2212,
          "samples": 24576
        },
        {
          "distance": 9,
          "angles": {
            "lon": -109.95746616236863,
            "lat": 16.097331179630828,
            "roll": -19.78735202886162
          },
          "before": 0.8155875973785994,
          "after": 0.40649838614977246,
          "evaluations": 2170,
          "samples": 24576
        }
      ]
    },
    "flower": {
      "config": {
        "method": "tetra",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -46.149549272283934,
            "lat": -40.13158198579208,
            "roll": -177.00252107866106
          },
          "before": 0.010132054790212768,
          "after": 0.010132054790212768,
          "evaluations": 2140,
          "samples": 36864
        },
        {
          "distance": 1,
          "angles": {
            "lon": -140.59904538989088,
            "lat": -8.09061020537547,
            "roll": -132.737231516093
          },
          "before": 0.03308118025267634,
          "after": 0.032283189240268594,
          "evaluations": 2218,
          "samples": 36864
        },
        {
          "distance": 2,
          "angles": {
            "lon": -142.1740453898907,
            "lat": -5.765610205375651,
            "roll": -134.312231516093
          },
          "before": 0.07638038355039295,
          "after": 0.07638038355039295,
          "evaluations": 2236,
          "samples": 36864
        },
        {
          "distance": 3,
          "angles": {
            "lon": -142.9240453898907,
            "lat": -2.1656102053757422,
            "roll": -131.68723151609305
          },
          "before": 0.11183109675556802,
          "after": 0.11183109675556802,
          "evaluations": 2212,
          "samples": 36864
        },
        {
          "distance": 4,
          "angles": {
            "lon": -93.91767230406401,
            "lat": -31.427531500268458,
            "roll": -55.746809497475624
          },
          "before": 0.15898800803447352,
          "after": 0.15898800803447352,
          "evaluations": 2176,
          "samples": 36864
        },
        {
          "distance": 5,
          "angles": {
            "lon": -51.87033656537534,
            "lat": -41.74431084717912,
            "roll": -178.18989268764852
          },
          "before": 0.169048916258079,
          "after": 0.169048916258079,
          "evaluations": 2170,
          "samples": 36864
        },
        {
          "distance": 6,
          "angles": {
            "lon": -96.28556203767658,
            "lat": 14.65111034090728,
            "roll": -13.142774270474774
          },
          "before": 0.2603386507985679,
          "after": 0.25938039257888224,
          "evaluations": 2194,
          "samples": 36864
        },
        {
          "distance": 7,
          "angles": {
            "lon": 126.97025442123413,
            "lat": -45.90088786182906,
            "roll": -88.78578682467344
          },
          "before": 0.26106794378120085,
          "after": 0.26106794378120085,
          "evaluations": 2176,
          "samples": 36864
        },
        {
          "distance": 8,
          "angles": {
            "lon": -150.75710619874297,
            "lat": -9.331949778813168,
            "roll": -104.78888923935597
          },
          "before": 0.30809758836211387,
          "after": 0.30809758836211387,
          "evaluations": 2140,
          "samples": 36864
        },
        {
          "distance": 9,
          "angles": {
            "lon": -98.91056203767658,
            "lat": 13.97611034090744,
            "roll": -13.96777427047482
          },
          "before": 0.3409180067515394,
          "after": 0.3409180067515394,
          "evaluations": 2134,
          "samples": 36864
        }
      ]
    },
    "dymaxion": {
      "config": {
        "method": "tetra",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 160.51725552231073,
            "lat": -56.59690082781526,
            "roll": 161.52030056342483
          },
          "before": 0,
          "after": 0,
          "evaluations": 2074,
          "samples": 32768
        },
        {
          "distance": 1,
          "angles": {
            "lon": 166.51725552231073,
            "lat": -56.59690082781526,
            "roll": 161.52030056342483
          },
          "before": 0,
          "after": 0,
          "evaluations": 2116,
          "samples": 32768
        },
        {
          "distance": 2,
          "angles": {
            "lon": 166.51725552231073,
            "lat": -55.09690082781526,
            "roll": 161.52030056342483
          },
          "before": 0,
          "after": 0,
          "evaluations": 2206,
          "samples": 32768
        },
        {
          "distance": 3,
          "angles": {
            "lon": 166.21725552231067,
            "lat": -56.146900827815216,
            "roll": 161.52030056342483
          },
          "before": 0.0078425709296433,
          "after": 0.0078425709296433,
          "evaluations": 2146,
          "samples": 32768
        },
        {
          "distance": 4,
          "angles": {
            "lon": 163.08264076933278,
            "lat": -56.62455558449096,
            "roll": 157.18897954523572
          },
          "before": 0.026949439587134923,
          "after": 0.02155148575700229,
          "evaluations": 2236,
          "samples": 32768
        },
        {
          "distance": 5,
          "angles": {
            "lon": 147.10764076933265,
            "lat": -60.37455558449096,
            "roll": 143.68897954523572
          },
          "before": 0.07745757532389547,
          "after": 0.07745757532389547,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 6,
          "angles": {
            "lon": 149.13623247966189,
            "lat": -59.5384287606326,
            "roll": 142.2723152607682
          },
          "before": 0.0947955513482831,
          "after": 0.09392518980673205,
          "evaluations": 2206,
          "samples": 32768
        },
        {
          "distance": 7,
          "angles": {
            "lon": 160.4422555223107,
            "lat": -57.721900827815205,
            "roll": 146.37030056342473
          },
          "before": 0.1266274799023614,
          "after": 0.1266274799023614,
          "evaluations": 2212,
          "samples": 32768
        },
        {
          "distance": 8,
          "angles": {
            "lon": 161.9869559526444,
            "lat": -57.535964805966216,
            "roll": 147.30373975709085
          },
          "before": 0.16163795623428032,
          "after": 0.16163795623428032,
          "evaluations": 2218,
          "samples": 32768
        },
        {
          "distance": 9,
          "angles": {
            "lon": 162.3619559526444,
            "lat": -60.31096480596625,
            "roll": 151.05373975709074
          },
          "before": 0.22584533007029164,
          "after": 0.22584533007029164,
          "evaluations": 2224,
          "samples": 32768
        }
      ]
    },
    "bighex": {
      "config": {
        "method": "tetra",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -84.57953417636452,
            "lat": -70.4527399540666,
            "roll": 98.41033484973013
          },
          "before": 0.07221183784925772,
          "after": 0.051435607677146326,
          "evaluations": 2104,
          "samples": 49152
        },
        {
          "distance": 1,
          "angles": {
            "lon": -40.86972056664524,
            "lat": -69.46992194128171,
            "roll": 119.40365850068633
          },
          "before": 0.09577577247287594,
          "after": 0.08945985230906352,
          "evaluations": 2224,
          "samples": 49152
        },
        {
          "distance": 2,
          "angles": {
            "lon": -146.946002144739,
            "lat": -2.1248701349579733,
            "roll": -134.29626483656466
          },
          "before": 0.15485675911977784,
          "after": 0.11863935503437849,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 3,
          "angles": {
            "lon": -146.42100214473902,
            "lat": -1.1498701349580642,
            "roll": -134.44626483656464
          },
          "before": 0.16509770066189294,
          "after": 0.14798036954575575,
          "evaluations": 2170,
          "samples": 49152
        },
        {
          "distance": 4,
          "angles": {
            "lon": -26.67614520862685,
            "lat": 13.954966666163614,
            "roll": -139.80289113521576
          },
          "before": 0.18602704501829737,
          "after": 0.17579770197374087,
          "evaluations": 2206,
          "samples": 49152
        },
        {
          "distance": 5,
          "angles": {
            "lon": 121.06068242266747,
            "lat": -48.118369542199844,
            "roll": -95.9185554429888
          },
          "before": 0.20271035667279916,
          "after": 0.20070456371757273,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 6,
          "angles": {
            "lon": -125.39635820053525,
            "lat": -49.6128803369279,
            "roll": -100.17273312695329
          },
          "before": 0.2369056569101945,
          "after": 0.22865092206737855,
          "evaluations": 2230,
          "samples": 49152
        },
        {
          "distance": 7,
          "angles": {
            "lon": -156.120953559503,
            "lat": 20.836686607045976,
            "roll": -112.38518070168789
          },
          "before": 0.2846719791445884,
          "after": 0.26981472429446846,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 8,
          "angles": {
            "lon": -119.98171909041702,
            "lat": -54.49011323325158,
            "roll": -97.91254263930023
          },
          "before": 0.2968780001794628,
          "after": 0.27486659507223443,
          "evaluations": 2212,
          "samples": 49152
        },
        {
          "distance": 9,
          "angles": {
            "lon": -118.10671909041707,
            "lat": -54.86511323325158,
            "roll": -95.51254263930025
          },
          "before": 0.3368107941138945,
          "after": 0.31210219045441095,
          "evaluations": 2200,
          "samples": 49152
        }
      ]
    },
    "felv": {
      "config": {
        "method": "tetra",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 160.8619559526444,
            "lat": -45.23596480596626,
            "roll": 150.6037397570908
          },
          "before": 0.002192676753649082,
          "after": 0.002192676753649082,
          "evaluations": 2182,
          "samples": 26624
        },
        {
          "distance": 1,
          "angles": {
            "lon": 160.67450540475545,
            "lat": -41.265676466012906,
            "roll": 152.23558234758673
          },
          "before": 0.020773275062727376,
          "after": 0.020773275062727376,
          "evaluations": 2176,
          "samples": 26624
        },
        {
          "distance": 2,
          "angles": {
            "lon": 161.0576407693327,
            "lat": -38.84955558449087,
            "roll": 155.91397954523586
          },
          "before": 0.04662230027148721,
          "after": 0.03885850062324587,
          "evaluations": 2176,
          "samples": 26624
        },
        {
          "distance": 3,
          "angles": {
            "lon": 159.93264076933247,
            "lat": -34.04955558449109,
            "roll": 155.01397954523554
          },
          "before": 0.06149397757998622,
          "after": 0.06072953125699016,
          "evaluations": 2176,
          "samples": 26624
        },
        {
          "distance": 4,
          "angles": {
            "lon": 148.51725552231073,
            "lat": -62.07190082781523,
            "roll": 165.87030056342485
          },
          "before": 0.09550269638780451,
          "after": 0.09550269638780451,
          "evaluations": 2158,
          "samples": 26624
        },
        {
          "distance": 5,
          "angles": {
            "lon": 150.5422555223106,
            "lat": -61.696900827815284,
            "roll": 167.07030056342478
          },
          "before": 0.11248656138473598,
          "after": 0.11248656138473598,
          "evaluations": 2188,
          "samples": 26624
        },
        {
          "distance": 6,
          "angles": {
            "lon": 149.66123247966163,
            "lat": -60.96342876063261,
            "roll": 164.69731526076794
          },
          "before": 0.1301517560737024,
          "after": 0.1301517560737024,
          "evaluations": 2212,
          "samples": 26624
        },
        {
          "distance": 7,
          "angles": {
            "lon": -165.83411490619181,
            "lat": -67.51503611718033,
            "roll": -152.20716519579292
          },
          "before": 0.17032449278379483,
          "after": 0.17032449278379483,
          "evaluations": 2140,
          "samples": 26624
        },
        {
          "distance": 8,
          "angles": {
            "lon": -174.60911490619185,
            "lat": -65.19003611718034,
            "roll": -159.70716519579292
          },
          "before": 0.194236472383248,
          "after": 0.194236472383248,
          "evaluations": 2170,
          "samples": 26624
        },
        {
          "distance": 9,
          "angles": {
            "lon": -174.0661602471023,
            "lat": -54.6336468056777,
            "roll": 15.162685877457307
          },
          "before": 0.19288303508424687,
          "after": 0.19288303508424687,
          "evaluations": 2266,
          "samples": 26624
        }
      ]
    }
  },
  "octa": {
    "infinite": {
      "config": {
        "method": "octa",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "all-hex-edges",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -179.7393229790032,
            "lat": 28.431984540999792,
            "roll": -7.595907229185059
          },
          "before": 0.24432218576759457,
          "after": 0.11675953915102995,
          "evaluations": 2212,
          "samples": 24576
        },
        {
          "distance": 1,
          "angles": {
            "lon": 84.86821245364854,
            "lat": 6.907701204972909,
            "roll": 120.2792391378432
          },
          "before": 0.31834451874253844,
          "after": 0.14240416288011368,
          "evaluations": 2236,
          "samples": 24576
        },
        {
          "distance": 2,
          "angles": {
            "lon": -176.58932297900327,
            "lat": 29.706984540999656,
            "roll": -9.920907229185104
          },
          "before": 0.36776987165677316,
          "after": 0.1651491534989443,
          "evaluations": 2176,
          "samples": 24576
        },
        {
          "distance": 3,
          "angles": {
            "lon": -174.4845306750388,
            "lat": 32.00868122216821,
            "roll": 167.44581167511637
          },
          "before": 0.4117404315054483,
          "after": 0.20567090140895758,
          "evaluations": 2212,
          "samples": 24576
        },
        {
          "distance": 4,
          "angles": {
            "lon": -176.73453067503868,
            "lat": 30.658681222168298,
            "roll": 169.3208116751166
          },
          "before": 0.44823454997352513,
          "after": 0.2426455760224097,
          "evaluations": 2224,
          "samples": 24576
        },
        {
          "distance": 5,
          "angles": {
            "lon": -170.9339115969837,
            "lat": -73.0676122736121,
            "roll": -71.32392059415577
          },
          "before": 0.49678492254316087,
          "after": 0.3069819261513388,
          "evaluations": 2116,
          "samples": 24576
        },
        {
          "distance": 6,
          "angles": {
            "lon": 143.22467404045142,
            "lat": -43.27057591363001,
            "roll": 70.89399282149952
          },
          "before": 0.537977569279237,
          "after": 0.33335030212961936,
          "evaluations": 2158,
          "samples": 24576
        },
        {
          "distance": 7,
          "angles": {
            "lon": -20.46973254270847,
            "lat": -14.092677783314457,
            "roll": 159.09223055429766
          },
          "before": 0.587593937102387,
          "after": 0.36176259794519955,
          "evaluations": 2176,
          "samples": 24576
        },
        {
          "distance": 8,
          "angles": {
            "lon": -19.86973254270856,
            "lat": -14.317677783314593,
            "roll": 158.11723055429752
          },
          "before": 0.6304678863512371,
          "after": 0.38101956418587196,
          "evaluations": 2236,
          "samples": 24576
        },
        {
          "distance": 9,
          "angles": {
            "lon": -18.669732542708516,
            "lat": -13.792677783314502,
            "roll": 158.56723055429757
          },
          "before": 0.6682068617110487,
          "after": 0.4006596773323679,
          "evaluations": 2200,
          "samples": 24576
        }
      ]
    },
    "flower": {
      "config": {
        "method": "octa",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -113.052150271833,
            "lat": 23.963949303472646,
            "roll": 90.74545768126848
          },
          "before": 0.036643637989455004,
          "after": 0.036643637989455004,
          "evaluations": 2110,
          "samples": 36864
        },
        {
          "distance": 1,
          "angles": {
            "lon": 156.0552065234632,
            "lat": 2.7082171886164588,
            "roll": 21.41869421191518
          },
          "before": 0.07974125618418205,
          "after": 0.07974125618418205,
          "evaluations": 2152,
          "samples": 36864
        },
        {
          "distance": 2,
          "angles": {
            "lon": -90.87090049423279,
            "lat": -8.405379827960473,
            "roll": 60.036471197381616
          },
          "before": 0.10919189911574424,
          "after": 0.10919189911574424,
          "evaluations": 2170,
          "samples": 36864
        },
        {
          "distance": 3,
          "angles": {
            "lon": -92.22090049423275,
            "lat": -8.55537982796045,
            "roll": 59.06147119738159
          },
          "before": 0.12618011190175266,
          "after": 0.12618011190175266,
          "evaluations": 2158,
          "samples": 36864
        },
        {
          "distance": 4,
          "angles": {
            "lon": -92.22090049423275,
            "lat": -8.93037982796045,
            "roll": 57.71147119738157
          },
          "before": 0.15645165277200734,
          "after": 0.15645165277200734,
          "evaluations": 2170,
          "samples": 36864
        },
        {
          "distance": 5,
          "angles": {
            "lon": -92.29590049423274,
            "lat": -8.630379827960496,
            "roll": 56.81147119738159
          },
          "before": 0.20398251208365542,
          "after": 0.20398251208365542,
          "evaluations": 2134,
          "samples": 36864
        },
        {
          "distance": 6,
          "angles": {
            "lon": 158.84719266816978,
            "lat": 2.76577063648665,
            "roll": 35.32613435983649
          },
          "before": 0.23413975487481883,
          "after": 0.23413975487481883,
          "evaluations": 2146,
          "samples": 36864
        },
        {
          "distance": 7,
          "angles": {
            "lon": 34.2736292995512,
            "lat": 66.99598306327209,
            "roll": 33.73962361067538
          },
          "before": 0.2888243609096523,
          "after": 0.2888243609096523,
          "evaluations": 2152,
          "samples": 36864
        },
        {
          "distance": 8,
          "angles": {
            "lon": 40.34862929955125,
            "lat": 65.1209830632722,
            "roll": 32.164623610675335
          },
          "before": 0.30927314684143464,
          "after": 0.30927314684143464,
          "evaluations": 2182,
          "samples": 36864
        },
        {
          "distance": 9,
          "angles": {
            "lon": 42.22362929955125,
            "lat": 64.52098306327207,
            "roll": 29.23962361067538
          },
          "before": 0.3286825072629988,
          "after": 0.3286825072629988,
          "evaluations": 2176,
          "samples": 36864
        }
      ]
    },
    "dymaxion": {
      "config": {
        "method": "octa",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -14.034037236124277,
            "lat": 53.45003944091263,
            "roll": 108.24813710153103
          },
          "before": 0,
          "after": 0,
          "evaluations": 2080,
          "samples": 32768
        },
        {
          "distance": 1,
          "angles": {
            "lon": -12.620669452473521,
            "lat": 54.57457304771356,
            "roll": 108.78146589361131
          },
          "before": 0,
          "after": 0,
          "evaluations": 2116,
          "samples": 32768
        },
        {
          "distance": 2,
          "angles": {
            "lon": -13.284037236124277,
            "lat": 54.95003944091263,
            "roll": 108.24813710153103
          },
          "before": 0,
          "after": 0,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 3,
          "angles": {
            "lon": -16.498161267489195,
            "lat": 53.426359610262125,
            "roll": 110.54089534431694
          },
          "before": 0.022608463103318252,
          "after": 0.022608463103318252,
          "evaluations": 2188,
          "samples": 32768
        },
        {
          "distance": 4,
          "angles": {
            "lon": -14.709037236124459,
            "lat": 57.350039440912724,
            "roll": 106.2981371015311
          },
          "before": 0.03183216485716768,
          "after": 0.03183216485716768,
          "evaluations": 2140,
          "samples": 32768
        },
        {
          "distance": 5,
          "angles": {
            "lon": -17.09659569002679,
            "lat": 56.77053435155449,
            "roll": 108.04104426540425
          },
          "before": 0.070834856614122,
          "after": 0.070834856614122,
          "evaluations": 2194,
          "samples": 32768
        },
        {
          "distance": 6,
          "angles": {
            "lon": 168.70764124318964,
            "lat": 45.85534202833401,
            "roll": 158.0392824053764
          },
          "before": 0.13124187508593932,
          "after": 0.13124187508593932,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 7,
          "angles": {
            "lon": 170.01445640847078,
            "lat": 45.74085800189448,
            "roll": 159.19244304299355
          },
          "before": 0.14653176125667108,
          "after": 0.14653176125667108,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 8,
          "angles": {
            "lon": 171.03264124318957,
            "lat": 46.15534202833419,
            "roll": 157.96428240537648
          },
          "before": 0.18004163538052567,
          "after": 0.18004163538052567,
          "evaluations": 2170,
          "samples": 32768
        },
        {
          "distance": 9,
          "angles": {
            "lon": 169.24046932496128,
            "lat": 46.85868122216823,
            "roll": 161.0708116751165
          },
          "before": 0.21908332777543532,
          "after": 0.21908332777543532,
          "evaluations": 2170,
          "samples": 32768
        }
      ]
    },
    "bighex": {
      "config": {
        "method": "octa",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 48.78694302476947,
            "lat": 4.110335600762369,
            "roll": 33.59531982354815
          },
          "before": 0.09067393538097528,
          "after": 0.07634227110133573,
          "evaluations": 2188,
          "samples": 49152
        },
        {
          "distance": 1,
          "angles": {
            "lon": 84.86821245364843,
            "lat": 6.982701204972955,
            "roll": 120.20423913784316
          },
          "before": 0.11513741258926873,
          "after": 0.10342499082043981,
          "evaluations": 2236,
          "samples": 49152
        },
        {
          "distance": 2,
          "angles": {
            "lon": 84.19321245364836,
            "lat": 7.057701204973,
            "roll": 120.87923913784323
          },
          "before": 0.14227175188968047,
          "after": 0.12452757004548122,
          "evaluations": 2206,
          "samples": 49152
        },
        {
          "distance": 3,
          "angles": {
            "lon": 147.67219266816983,
            "lat": 1.3407706364866954,
            "roll": 33.22613435983658
          },
          "before": 0.1748932796536914,
          "after": 0.15223701679385196,
          "evaluations": 2176,
          "samples": 49152
        },
        {
          "distance": 4,
          "angles": {
            "lon": 151.69671089798226,
            "lat": 6.480242256213046,
            "roll": 43.03126686438918
          },
          "before": 0.17965896242907067,
          "after": 0.17476778253876954,
          "evaluations": 2212,
          "samples": 49152
        },
        {
          "distance": 5,
          "angles": {
            "lon": 155.5471926681696,
            "lat": 5.390770636486764,
            "roll": 38.926134359836624
          },
          "before": 0.1926738208522777,
          "after": 0.19264832002494212,
          "evaluations": 2254,
          "samples": 49152
        },
        {
          "distance": 6,
          "angles": {
            "lon": 157.09671089798212,
            "lat": 4.455242256213296,
            "roll": 37.70626686438936
          },
          "before": 0.20406933745072756,
          "after": 0.20392235742436615,
          "evaluations": 2194,
          "samples": 49152
        },
        {
          "distance": 7,
          "angles": {
            "lon": 158.09719266816978,
            "lat": 3.590770636486468,
            "roll": 36.60113435983658
          },
          "before": 0.2691764364742881,
          "after": 0.22816028962250626,
          "evaluations": 2188,
          "samples": 49152
        },
        {
          "distance": 8,
          "angles": {
            "lon": 153.6721926681696,
            "lat": 5.9157706364865135,
            "roll": 36.22613435983658
          },
          "before": 0.2735554676618707,
          "after": 0.2574464009216016,
          "evaluations": 2272,
          "samples": 49152
        },
        {
          "distance": 9,
          "angles": {
            "lon": 154.0796846866608,
            "lat": -0.7244055777989615,
            "roll": 39.659539360553026
          },
          "before": 0.30507158113090616,
          "after": 0.3043465674152308,
          "evaluations": 2218,
          "samples": 49152
        }
      ]
    },
    "felv": {
      "config": {
        "method": "octa",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 3.7181310061365593,
            "lat": 51.569617314773836,
            "roll": -86.10394916720685
          },
          "before": 0.003718517708643292,
          "after": 0.0000643010550130721,
          "evaluations": 2158,
          "samples": 26624
        },
        {
          "distance": 1,
          "angles": {
            "lon": 1.318131006136582,
            "lat": 52.01961731477377,
            "roll": -86.85394916720685
          },
          "before": 0.03519684992416906,
          "after": 0.02827935294279429,
          "evaluations": 2158,
          "samples": 26624
        },
        {
          "distance": 2,
          "angles": {
            "lon": -32.29818521328269,
            "lat": 64.29983717952939,
            "roll": 92.28518186397844
          },
          "before": 0.06534983412997591,
          "after": 0.06534983412997591,
          "evaluations": 2206,
          "samples": 26624
        },
        {
          "distance": 3,
          "angles": {
            "lon": -15.42318521328275,
            "lat": 59.42483717952928,
            "roll": 78.63518186397857
          },
          "before": 0.0999039526084595,
          "after": 0.0999039526084595,
          "evaluations": 2188,
          "samples": 26624
        },
        {
          "distance": 4,
          "angles": {
            "lon": -38.58738429173832,
            "lat": 59.24894796090416,
            "roll": 113.00497463196507
          },
          "before": 0.11429635205721092,
          "after": 0.11429635205721092,
          "evaluations": 2188,
          "samples": 26624
        },
        {
          "distance": 5,
          "angles": {
            "lon": -40.01238429173833,
            "lat": 61.423947960904115,
            "roll": 110.82997463196489
          },
          "before": 0.13751198162906278,
          "after": 0.13748235858930422,
          "evaluations": 2182,
          "samples": 26624
        },
        {
          "distance": 6,
          "angles": {
            "lon": -45.78738429173836,
            "lat": 58.04894796090434,
            "roll": 112.77997463196493
          },
          "before": 0.16814012096679323,
          "after": 0.16767749599763457,
          "evaluations": 2152,
          "samples": 26624
        },
        {
          "distance": 7,
          "angles": {
            "lon": -38.437384291738226,
            "lat": 59.32394796090398,
            "roll": 105.80497463196525
          },
          "before": 0.18715458175591076,
          "after": 0.18715458175591076,
          "evaluations": 2188,
          "samples": 26624
        },
        {
          "distance": 8,
          "angles": {
            "lon": -114.94439740218223,
            "lat": -9.479086526699916,
            "roll": -30.411807271465648
          },
          "before": 0.2199727197844515,
          "after": 0.2199727197844515,
          "evaluations": 2152,
          "samples": 26624
        },
        {
          "distance": 9,
          "angles": {
            "lon": -115.31939740218223,
            "lat": -9.479086526699916,
            "roll": -31.83680727146566
          },
          "before": 0.24977023873607868,
          "after": 0.24977023873607868,
          "evaluations": 2248,
          "samples": 26624
        }
      ]
    }
  },
  "rhombic": {
    "infinite": {
      "config": {
        "method": "rhombic",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "all-hex-edges",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 178.04000940732658,
            "lat": 67.14833477595857,
            "roll": 130.3435273367911
          },
          "before": 0.2072366650472254,
          "after": 0.12575898301435853,
          "evaluations": 2164,
          "samples": 24576
        },
        {
          "distance": 1,
          "angles": {
            "lon": -20.103349537029885,
            "lat": 37.17730094825481,
            "roll": 120.13147700764239
          },
          "before": 0.2571019153782374,
          "after": 0.16711959760134706,
          "evaluations": 2188,
          "samples": 24576
        },
        {
          "distance": 2,
          "angles": {
            "lon": -175.6143229790032,
            "lat": 29.7819845409997,
            "roll": -10.445907229184968
          },
          "before": 0.29852137020377484,
          "after": 0.1875942999570398,
          "evaluations": 2188,
          "samples": 24576
        },
        {
          "distance": 3,
          "angles": {
            "lon": -176.88932297900317,
            "lat": 30.456984540999656,
            "roll": -10.295907229185104
          },
          "before": 0.33862859697724507,
          "after": 0.22202386185024672,
          "evaluations": 2206,
          "samples": 24576
        },
        {
          "distance": 4,
          "angles": {
            "lon": -175.45953067503865,
            "lat": 28.258681222168207,
            "roll": 166.84581167511647
          },
          "before": 0.38331950123953384,
          "after": 0.27618161152116877,
          "evaluations": 2164,
          "samples": 24576
        },
        {
          "distance": 5,
          "angles": {
            "lon": 27.247403167560833,
            "lat": 65.06071821862338,
            "roll": 41.88677322529247
          },
          "before": 0.4223121961759925,
          "after": 0.31380162970247744,
          "evaluations": 2164,
          "samples": 24576
        },
        {
          "distance": 6,
          "angles": {
            "lon": 159.0707622494548,
            "lat": 14.985134822982104,
            "roll": -159.57064828835428
          },
          "before": 0.4686448827259655,
          "after": 0.3370546385467182,
          "evaluations": 2176,
          "samples": 24576
        },
        {
          "distance": 7,
          "angles": {
            "lon": -20.495417945086956,
            "lat": -14.01449254923591,
            "roll": 159.06485542282462
          },
          "before": 0.5142991200906634,
          "after": 0.36376134277602784,
          "evaluations": 2266,
          "samples": 24576
        },
        {
          "distance": 8,
          "angles": {
            "lon": -139.37768189236522,
            "lat": -65.61326253023441,
            "roll": -33.28347233980895
          },
          "before": 0.5516080009763992,
          "after": 0.38557353255699534,
          "evaluations": 2212,
          "samples": 24576
        },
        {
          "distance": 9,
          "angles": {
            "lon": 161.48542958535245,
            "lat": 14.09287662937436,
            "roll": 21.19814841561015
          },
          "before": 0.6011935288855886,
          "after": 0.40503334937333885,
          "evaluations": 2218,
          "samples": 24576
        }
      ]
    },
    "flower": {
      "config": {
        "method": "rhombic",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 42.11616880595682,
            "lat": 0.9246708935432935,
            "roll": 40.175895682722285
          },
          "before": 0.015038754945410796,
          "after": 0.012026787070991068,
          "evaluations": 2158,
          "samples": 36864
        },
        {
          "distance": 1,
          "angles": {
            "lon": 132.47383515760305,
            "lat": 40.19079148977437,
            "roll": 87.45012620687487
          },
          "before": 0.050064427914565494,
          "after": 0.050064427914565494,
          "evaluations": 2182,
          "samples": 36864
        },
        {
          "distance": 2,
          "angles": {
            "lon": -45.17779760621488,
            "lat": 57.507495856824335,
            "roll": 5.0312497448176146
          },
          "before": 0.09170838657666144,
          "after": 0.09170838657666144,
          "evaluations": 2188,
          "samples": 36864
        },
        {
          "distance": 3,
          "angles": {
            "lon": 47.74116880595682,
            "lat": 4.899670893543089,
            "roll": 31.62589568272233
          },
          "before": 0.13092753595408815,
          "after": 0.13092753595408815,
          "evaluations": 2254,
          "samples": 36864
        },
        {
          "distance": 4,
          "angles": {
            "lon": -53.0364588573575,
            "lat": 57.37867824017417,
            "roll": 11.428687953203962
          },
          "before": 0.1631471667246879,
          "after": 0.1631471667246879,
          "evaluations": 2260,
          "samples": 36864
        },
        {
          "distance": 5,
          "angles": {
            "lon": 36.82999115623534,
            "lat": 1.2508043070749864,
            "roll": 41.17129632644355
          },
          "before": 0.20720359858904505,
          "after": 0.20720359858904505,
          "evaluations": 2104,
          "samples": 36864
        },
        {
          "distance": 6,
          "angles": {
            "lon": 36.75499115623529,
            "lat": 0.6508043070750773,
            "roll": 42.89629632644346
          },
          "before": 0.24124370815417132,
          "after": 0.24124370815417132,
          "evaluations": 2110,
          "samples": 36864
        },
        {
          "distance": 7,
          "angles": {
            "lon": 157.12219266816965,
            "lat": 1.340770636486468,
            "roll": 39.22613435983658
          },
          "before": 0.29023086523502684,
          "after": 0.29023086523502684,
          "evaluations": 2164,
          "samples": 36864
        },
        {
          "distance": 8,
          "angles": {
            "lon": 156.0721926681697,
            "lat": 3.365770636486559,
            "roll": 36.82613435983649
          },
          "before": 0.3144275415882076,
          "after": 0.3144275415882076,
          "evaluations": 2152,
          "samples": 36864
        },
        {
          "distance": 9,
          "angles": {
            "lon": 167.39576224945495,
            "lat": 13.485134822982218,
            "roll": -165.72064828835437
          },
          "before": 0.35293879893404734,
          "after": 0.35276595997614124,
          "evaluations": 2116,
          "samples": 36864
        }
      ]
    },
    "dymaxion": {
      "config": {
        "method": "rhombic",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -170.01889457926154,
            "lat": 32.99273576349003,
            "roll": -13.384930707514286
          },
          "before": 0,
          "after": 0,
          "evaluations": 2110,
          "samples": 32768
        },
        {
          "distance": 1,
          "angles": {
            "lon": -174.1143229790032,
            "lat": 29.931984540999792,
            "roll": -9.920907229185104
          },
          "before": 0,
          "after": 0,
          "evaluations": 2140,
          "samples": 32768
        },
        {
          "distance": 2,
          "angles": {
            "lon": -174.1143229790032,
            "lat": 31.431984540999792,
            "roll": -9.920907229185104
          },
          "before": 0,
          "after": 0,
          "evaluations": 2230,
          "samples": 32768
        },
        {
          "distance": 3,
          "angles": {
            "lon": -174.10953394509846,
            "lat": 31.33952046826232,
            "roll": -9.820429288968398
          },
          "before": 0.007453986965818693,
          "after": 0.007453986965818693,
          "evaluations": 2242,
          "samples": 32768
        },
        {
          "distance": 4,
          "angles": {
            "lon": -171.96889457926153,
            "lat": 30.2927357634901,
            "roll": -11.884930707514286
          },
          "before": 0.029020309486244247,
          "after": 0.029020309486244247,
          "evaluations": 2248,
          "samples": 32768
        },
        {
          "distance": 5,
          "angles": {
            "lon": -174.9264549929648,
            "lat": 33.73993078447597,
            "roll": -9.671011976525051
          },
          "before": 0.0776424324275842,
          "after": 0.07735090053639858,
          "evaluations": 2152,
          "samples": 32768
        },
        {
          "distance": 6,
          "angles": {
            "lon": -169.5393229790032,
            "lat": 24.23198454099986,
            "roll": -19.22090722918506
          },
          "before": 0.11563858231477948,
          "after": 0.11563858231477948,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 7,
          "angles": {
            "lon": -169.76432297900317,
            "lat": 25.806984540999792,
            "roll": -18.695907229185195
          },
          "before": 0.1716292134294529,
          "after": 0.1716292134294529,
          "evaluations": 2230,
          "samples": 32768
        },
        {
          "distance": 8,
          "angles": {
            "lon": 64.73584061488509,
            "lat": 14.946174302109966,
            "roll": -41.32310910522932
          },
          "before": 0.20836395225024992,
          "after": 0.20836395225024992,
          "evaluations": 2188,
          "samples": 32768
        },
        {
          "distance": 9,
          "angles": {
            "lon": 166.13542958535254,
            "lat": 19.56787662937427,
            "roll": 8.373148415610217
          },
          "before": 0.23024167629121522,
          "after": 0.23024167629121522,
          "evaluations": 2164,
          "samples": 32768
        }
      ]
    },
    "bighex": {
      "config": {
        "method": "rhombic",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 44.29116880595677,
            "lat": 0.32467089354315704,
            "roll": 39.950895682722376
          },
          "before": 0.08389175367663383,
          "after": 0.06683539962865488,
          "evaluations": 2188,
          "samples": 49152
        },
        {
          "distance": 1,
          "angles": {
            "lon": 69.21975886300197,
            "lat": 53.30505378729231,
            "roll": -19.16006427258253
          },
          "before": 0.1169389044244606,
          "after": 0.10805521974566144,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 2,
          "angles": {
            "lon": 147.55468468666072,
            "lat": 0.5505944222011294,
            "roll": 32.909539360553026
          },
          "before": 0.1422038076546482,
          "after": 0.13541977265555102,
          "evaluations": 2164,
          "samples": 49152
        },
        {
          "distance": 3,
          "angles": {
            "lon": 147.6467108979822,
            "lat": 1.305242256213205,
            "roll": 33.206266864389136
          },
          "before": 0.16497642256561684,
          "after": 0.15068402591478938,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 4,
          "angles": {
            "lon": 148.52968468666074,
            "lat": 1.750594422201175,
            "roll": 32.45953936055298
          },
          "before": 0.1772104915189382,
          "after": 0.1743583046805163,
          "evaluations": 2236,
          "samples": 49152
        },
        {
          "distance": 5,
          "angles": {
            "lon": 156.0721926681697,
            "lat": 4.565770636486604,
            "roll": 37.87613435983644
          },
          "before": 0.1973251600876764,
          "after": 0.1971757602703665,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 6,
          "angles": {
            "lon": 157.02171089798208,
            "lat": 4.530242256213114,
            "roll": 37.78126686438918
          },
          "before": 0.20996788093428354,
          "after": 0.2099196370206676,
          "evaluations": 2164,
          "samples": 49152
        },
        {
          "distance": 7,
          "angles": {
            "lon": 157.2467108979821,
            "lat": 3.780242256213228,
            "roll": 37.03126686438918
          },
          "before": 0.2723289432904728,
          "after": 0.23823666081116432,
          "evaluations": 2188,
          "samples": 49152
        },
        {
          "distance": 8,
          "angles": {
            "lon": 156.2971926681697,
            "lat": 4.715770636486582,
            "roll": 35.326134359836715
          },
          "before": 0.29116677983010425,
          "after": 0.2675053972829568,
          "evaluations": 2164,
          "samples": 49152
        },
        {
          "distance": 9,
          "angles": {
            "lon": 155.44671089798214,
            "lat": 1.380242256213137,
            "roll": 37.331266864389136
          },
          "before": 0.31279409435906713,
          "after": 0.3124662968050887,
          "evaluations": 2152,
          "samples": 49152
        }
      ]
    },
    "felv": {
      "config": {
        "method": "rhombic",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 150.47873873636127,
            "lat": 20.844480065163225,
            "roll": -13.244582068920181
          },
          "before": 0.10440308564725119,
          "after": 0.007386226609589486,
          "evaluations": 2134,
          "samples": 26624
        },
        {
          "distance": 1,
          "angles": {
            "lon": 165.41399853564803,
            "lat": 42.007924962356356,
            "roll": 91.6869058739394
          },
          "before": 0.14855032472316487,
          "after": 0.03675478261476865,
          "evaluations": 2254,
          "samples": 26624
        },
        {
          "distance": 2,
          "angles": {
            "lon": -3.4154608324170113,
            "lat": -43.17008094578142,
            "roll": -0.5146624334156513
          },
          "before": 0.06131566886008905,
          "after": 0.06131566886008905,
          "evaluations": 2224,
          "samples": 26624
        },
        {
          "distance": 3,
          "angles": {
            "lon": -5.183258477970867,
            "lat": -42.04019961295529,
            "roll": -1.7428079310803923
          },
          "before": 0.10425589116377271,
          "after": 0.10425589116377271,
          "evaluations": 2194,
          "samples": 26624
        },
        {
          "distance": 4,
          "angles": {
            "lon": -7.208258477970958,
            "lat": -42.6401996129552,
            "roll": -3.1678079310804605
          },
          "before": 0.13567615870292912,
          "after": 0.13567615870292912,
          "evaluations": 2140,
          "samples": 26624
        },
        {
          "distance": 5,
          "angles": {
            "lon": 163.0787387363613,
            "lat": 26.469480065163225,
            "roll": -10.46958206892009
          },
          "before": 0.29626235448066957,
          "after": 0.16985169695609503,
          "evaluations": 2188,
          "samples": 26624
        },
        {
          "distance": 6,
          "angles": {
            "lon": 161.5787387363613,
            "lat": 26.91948006516327,
            "roll": -10.169582068920135
          },
          "before": 0.3478144439950197,
          "after": 0.19737536676843895,
          "evaluations": 2230,
          "samples": 26624
        },
        {
          "distance": 7,
          "angles": {
            "lon": 161.0537387363613,
            "lat": 28.569480065163248,
            "roll": -10.169582068920135
          },
          "before": 0.22064019667436796,
          "after": 0.22064019667436796,
          "evaluations": 2194,
          "samples": 26624
        },
        {
          "distance": 8,
          "angles": {
            "lon": 160.60373873636127,
            "lat": 29.619480065163202,
            "roll": -10.319582068920113
          },
          "before": 0.24542305373380616,
          "after": 0.24542305373380616,
          "evaluations": 2200,
          "samples": 26624
        },
        {
          "distance": 9,
          "angles": {
            "lon": -15.040460832417011,
            "lat": -34.395080945781444,
            "roll": -12.139662433415651
          },
          "before": 0.283999352764281,
          "after": 0.283999352764281,
          "evaluations": 2230,
          "samples": 26624
        }
      ]
    }
  },
  "tetrakis": {
    "infinite": {
      "config": {
        "method": "tetrakis",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "all-hex-edges",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -71.01472279317682,
            "lat": 17.590187479982433,
            "roll": 99.78943669684236
          },
          "before": 0.2209154999605445,
          "after": 0.11537608631554613,
          "evaluations": 2200,
          "samples": 24576
        },
        {
          "distance": 1,
          "angles": {
            "lon": 154.7701060831546,
            "lat": -34.68169852626676,
            "roll": -129.4576394073665
          },
          "before": 0.2909732907651559,
          "after": 0.17569542598691065,
          "evaluations": 2260,
          "samples": 24576
        },
        {
          "distance": 2,
          "angles": {
            "lon": -175.8393229790032,
            "lat": 29.556984540999792,
            "roll": -10.145907229185013
          },
          "before": 0.3363186230221759,
          "after": 0.20097181199293046,
          "evaluations": 2236,
          "samples": 24576
        },
        {
          "distance": 3,
          "angles": {
            "lon": 88.01821245364852,
            "lat": 9.007701204972818,
            "roll": 121.0292391378432
          },
          "before": 0.37586099254294264,
          "after": 0.23900689690480936,
          "evaluations": 2218,
          "samples": 24576
        },
        {
          "distance": 4,
          "angles": {
            "lon": 32.339731213822915,
            "lat": -44.15281073691551,
            "roll": 45.607389862462924
          },
          "before": 0.407589177393044,
          "after": 0.2661708102589789,
          "evaluations": 2158,
          "samples": 24576
        },
        {
          "distance": 5,
          "angles": {
            "lon": -11.683279982954218,
            "lat": -11.560599987025398,
            "roll": 162.11718954741957
          },
          "before": 0.44467823047850336,
          "after": 0.3123196079556254,
          "evaluations": 2206,
          "samples": 24576
        },
        {
          "distance": 6,
          "angles": {
            "lon": 158.92219266816983,
            "lat": 3.4407706364866044,
            "roll": 36.37613435983667
          },
          "before": 0.48052915882064373,
          "after": 0.3327230274457196,
          "evaluations": 2158,
          "samples": 24576
        },
        {
          "distance": 7,
          "angles": {
            "lon": -11.570417945087001,
            "lat": -13.63949254923591,
            "roll": 161.68985542282462
          },
          "before": 0.5248272770113062,
          "after": 0.3623893887529632,
          "evaluations": 2278,
          "samples": 24576
        },
        {
          "distance": 8,
          "angles": {
            "lon": 162.61042958535256,
            "lat": 13.71787662937436,
            "roll": 21.873148415610217
          },
          "before": 0.5663743649174694,
          "after": 0.3864359983102064,
          "evaluations": 2158,
          "samples": 24576
        },
        {
          "distance": 9,
          "angles": {
            "lon": 161.48542958535245,
            "lat": 14.09287662937436,
            "roll": 21.19814841561015
          },
          "before": 0.6143339989527065,
          "after": 0.40859570192632955,
          "evaluations": 2194,
          "samples": 24576
        }
      ]
    },
    "flower": {
      "config": {
        "method": "tetrakis",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -49.472633486241136,
            "lat": 50.02894570159208,
            "roll": 1.8510193303227425
          },
          "before": 0.011633277772637302,
          "after": 0.011633277772637302,
          "evaluations": 2164,
          "samples": 36864
        },
        {
          "distance": 1,
          "angles": {
            "lon": 39.75499115623529,
            "lat": 8.075804307075032,
            "roll": 42.82129632644353
          },
          "before": 0.04218113662939184,
          "after": 0.04218113662939184,
          "evaluations": 2224,
          "samples": 36864
        },
        {
          "distance": 2,
          "angles": {
            "lon": -59.577797606214915,
            "lat": 43.857495856824244,
            "roll": 9.531249744817615
          },
          "before": 0.08807846357164958,
          "after": 0.08807846357164958,
          "evaluations": 2218,
          "samples": 36864
        },
        {
          "distance": 3,
          "angles": {
            "lon": -51.10279760621489,
            "lat": 50.83249585682438,
            "roll": -0.6687502551824309
          },
          "before": 0.12717058592869102,
          "after": 0.12717058592869102,
          "evaluations": 2236,
          "samples": 36864
        },
        {
          "distance": 4,
          "angles": {
            "lon": 127.24223792776456,
            "lat": 40.82867306854132,
            "roll": 88.51817471086974
          },
          "before": 0.16074144382763944,
          "after": 0.16074144382763944,
          "evaluations": 2206,
          "samples": 36864
        },
        {
          "distance": 5,
          "angles": {
            "lon": 36.97999115623543,
            "lat": 1.7758043070750773,
            "roll": 41.9962963264436
          },
          "before": 0.19062876748738836,
          "after": 0.19062876748738836,
          "evaluations": 2176,
          "samples": 36864
        },
        {
          "distance": 6,
          "angles": {
            "lon": 36.67999115623536,
            "lat": 0.8758043070751,
            "roll": 42.97129632644351
          },
          "before": 0.22228307579348794,
          "after": 0.22228307579348794,
          "evaluations": 2122,
          "samples": 36864
        },
        {
          "distance": 7,
          "angles": {
            "lon": 124.45488657541569,
            "lat": 44.97015174735225,
            "roll": 94.50225345455101
          },
          "before": 0.2793151427727392,
          "after": 0.2793151427727392,
          "evaluations": 2146,
          "samples": 36864
        },
        {
          "distance": 8,
          "angles": {
            "lon": 83.10379105769096,
            "lat": -12.747075660903874,
            "roll": -75.61460061930126
          },
          "before": 0.3251732884737786,
          "after": 0.3251732884737786,
          "evaluations": 2134,
          "samples": 36864
        },
        {
          "distance": 9,
          "angles": {
            "lon": 167.5457622494548,
            "lat": 13.635134822982081,
            "roll": -165.64564828835438
          },
          "before": 0.3460744102966769,
          "after": 0.3460744102966769,
          "evaluations": 2158,
          "samples": 36864
        }
      ]
    },
    "dymaxion": {
      "config": {
        "method": "tetrakis",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 179.8856770209968,
            "lat": 38.93198454099979,
            "roll": -6.920907229185104
          },
          "before": 0,
          "after": 0,
          "evaluations": 2146,
          "samples": 32768
        },
        {
          "distance": 1,
          "angles": {
            "lon": -173.71988331712782,
            "lat": 30.195222830959892,
            "roll": -10.203820696100593
          },
          "before": 0,
          "after": 0,
          "evaluations": 2164,
          "samples": 32768
        },
        {
          "distance": 2,
          "angles": {
            "lon": -173.73453394509852,
            "lat": 31.33952046826232,
            "roll": -10.270429288968444
          },
          "before": 0,
          "after": 0,
          "evaluations": 2212,
          "samples": 32768
        },
        {
          "distance": 3,
          "angles": {
            "lon": -173.87645499296485,
            "lat": 31.339930784475882,
            "roll": -9.896011976525187
          },
          "before": 0.007644234810230775,
          "after": 0.007644234810230775,
          "evaluations": 2254,
          "samples": 32768
        },
        {
          "distance": 4,
          "angles": {
            "lon": -172.34389457926153,
            "lat": 29.992735763490032,
            "roll": -11.509930707514286
          },
          "before": 0.02471404210239282,
          "after": 0.02471404210239282,
          "evaluations": 2278,
          "samples": 32768
        },
        {
          "distance": 5,
          "angles": {
            "lon": -171.09488331712788,
            "lat": 28.995222830959847,
            "roll": -13.653820696100524
          },
          "before": 0.06610300243766062,
          "after": 0.06610300243766062,
          "evaluations": 2170,
          "samples": 32768
        },
        {
          "distance": 6,
          "angles": {
            "lon": -170.34488331712788,
            "lat": 26.59522283095987,
            "roll": -17.1788206961005
          },
          "before": 0.10647386912783663,
          "after": 0.10647386912783663,
          "evaluations": 2176,
          "samples": 32768
        },
        {
          "distance": 7,
          "angles": {
            "lon": -163.38932297900323,
            "lat": 27.83198454099977,
            "roll": -17.27090722918524
          },
          "before": 0.16635708741096364,
          "after": 0.16635708741096364,
          "evaluations": 2194,
          "samples": 32768
        },
        {
          "distance": 8,
          "angles": {
            "lon": 153.78369199745362,
            "lat": 5.186282552506327,
            "roll": 34.9429352391511
          },
          "before": 0.21289503747286834,
          "after": 0.21289503747286834,
          "evaluations": 2200,
          "samples": 32768
        },
        {
          "distance": 9,
          "angles": {
            "lon": 167.1352574218065,
            "lat": 20.295971525590403,
            "roll": 7.1462881889194705
          },
          "before": 0.23211916770280946,
          "after": 0.23211916770280946,
          "evaluations": 2146,
          "samples": 32768
        }
      ]
    },
    "bighex": {
      "config": {
        "method": "tetrakis",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 55.74185190908611,
            "lat": 39.80322367461736,
            "roll": 2.4354490745812427
          },
          "before": 0.07268268674464921,
          "after": 0.06711120867058608,
          "evaluations": 2206,
          "samples": 49152
        },
        {
          "distance": 1,
          "angles": {
            "lon": 147.2971926681697,
            "lat": 2.615770636486559,
            "roll": 50.251134359836556
          },
          "before": 0.11386846953151569,
          "after": 0.10127549462391672,
          "evaluations": 2200,
          "samples": 49152
        },
        {
          "distance": 2,
          "angles": {
            "lon": 148.27219266816974,
            "lat": 2.5407706364865135,
            "roll": 51.82613435983649
          },
          "before": 0.139698596390983,
          "after": 0.12494627813304303,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 3,
          "angles": {
            "lon": 35.66194302476947,
            "lat": 9.660335600762323,
            "roll": 45.82031982354829
          },
          "before": 0.15677133023320614,
          "after": 0.15624868960994187,
          "evaluations": 2254,
          "samples": 49152
        },
        {
          "distance": 4,
          "angles": {
            "lon": 148.4546846866608,
            "lat": 1.750594422201175,
            "roll": 32.534539360553026
          },
          "before": 0.1759106682416456,
          "after": 0.17334958652445762,
          "evaluations": 2248,
          "samples": 49152
        },
        {
          "distance": 5,
          "angles": {
            "lon": 156.8221926681697,
            "lat": 3.6657706364865135,
            "roll": 36.601134359836806
          },
          "before": 0.22133162671218798,
          "after": 0.199695640576081,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 6,
          "angles": {
            "lon": 157.7971926681697,
            "lat": 3.8157706364866044,
            "roll": 36.751134359836556
          },
          "before": 0.2558571650421995,
          "after": 0.2118106267691191,
          "evaluations": 2170,
          "samples": 49152
        },
        {
          "distance": 7,
          "angles": {
            "lon": 157.57219266816992,
            "lat": 4.4157706364865135,
            "roll": 36.301134359836624
          },
          "before": 0.2773565687244395,
          "after": 0.24183558202283675,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 8,
          "angles": {
            "lon": 156.42171089798217,
            "lat": 4.680242256213205,
            "roll": 35.30626686438927
          },
          "before": 0.28714559452077726,
          "after": 0.2723639012657442,
          "evaluations": 2218,
          "samples": 49152
        },
        {
          "distance": 9,
          "angles": {
            "lon": 17.834055980667472,
            "lat": 64.57331275785373,
            "roll": -131.12380019389093
          },
          "before": 0.3478819477319222,
          "after": 0.31498306160874656,
          "evaluations": 2188,
          "samples": 49152
        }
      ]
    },
    "felv": {
      "config": {
        "method": "tetrakis",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "outer-and-red-seams",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": 1.3845391675829433,
            "lat": -39.12008094578147,
            "roll": -0.36466243341556037
          },
          "before": 0.00576270076870639,
          "after": 0.00576270076870639,
          "evaluations": 2152,
          "samples": 26624
        },
        {
          "distance": 1,
          "angles": {
            "lon": 165.41399853564803,
            "lat": 42.0829249623564,
            "roll": 91.6869058739394
          },
          "before": 0.14227848566458107,
          "after": 0.037983075480523064,
          "evaluations": 2224,
          "samples": 26624
        },
        {
          "distance": 2,
          "angles": {
            "lon": -3.565460832417102,
            "lat": -43.32008094578151,
            "roll": -0.5896624334156968
          },
          "before": 0.05647288173268747,
          "after": 0.05647288173268747,
          "evaluations": 2134,
          "samples": 26624
        },
        {
          "distance": 3,
          "angles": {
            "lon": -4.958258477971185,
            "lat": -43.690199612955155,
            "roll": -0.46780793108052876
          },
          "before": 0.10095091160842469,
          "after": 0.09823477298319191,
          "evaluations": 2134,
          "samples": 26624
        },
        {
          "distance": 4,
          "angles": {
            "lon": -7.583258477970958,
            "lat": -42.94019961295521,
            "roll": -3.467807931080415
          },
          "before": 0.1353864254959539,
          "after": 0.1353864254959539,
          "evaluations": 2164,
          "samples": 26624
        },
        {
          "distance": 5,
          "angles": {
            "lon": 163.15373873636122,
            "lat": 26.39448006516318,
            "roll": -10.544582068920135
          },
          "before": 0.2878728868114102,
          "after": 0.18734444945695547,
          "evaluations": 2206,
          "samples": 26624
        },
        {
          "distance": 6,
          "angles": {
            "lon": -19.39046083241692,
            "lat": -38.145080945781444,
            "roll": -18.43966243341572
          },
          "before": 0.20488634454781265,
          "after": 0.20488634454781265,
          "evaluations": 2116,
          "samples": 26624
        },
        {
          "distance": 7,
          "angles": {
            "lon": -23.649308864772365,
            "lat": -37.04361813165764,
            "roll": -22.59415043368938
          },
          "before": 0.22916801130280495,
          "after": 0.22916801130280495,
          "evaluations": 2260,
          "samples": 26624
        },
        {
          "distance": 8,
          "angles": {
            "lon": -30.24930886477233,
            "lat": -34.41861813165764,
            "roll": -28.144150433689333
          },
          "before": 0.2545140441591549,
          "after": 0.2545140441591549,
          "evaluations": 2224,
          "samples": 26624
        },
        {
          "distance": 9,
          "angles": {
            "lon": -61.395146610215306,
            "lat": -20.26557141919875,
            "roll": -49.41423977427189
          },
          "before": 0.2826489579306439,
          "after": 0.2826489579306439,
          "evaluations": 2158,
          "samples": 26624
        }
      ]
    }
  },
  "lambert-one": {
    "single": {
      "config": {
        "method": "lambert-one",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "antipodal-point",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -113.3026042766869,
            "lat": 22.058934644941793,
            "roll": -63.51656958460808
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 1,
          "angles": {
            "lon": -113.3026042766869,
            "lat": 22.058934644941793,
            "roll": -63.51656958460808
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 2,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 3,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 4,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 5,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 6,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 7,
          "angles": {
            "lon": -83.24938382953405,
            "lat": -39.972005734060815,
            "roll": -79.61926454678178
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 8,
          "angles": {
            "lon": 68.66473828442395,
            "lat": 5.89190213173371,
            "roll": -142.3506696615368
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        },
        {
          "distance": 9,
          "angles": {
            "lon": 68.66473828442395,
            "lat": 5.89190213173371,
            "roll": -142.3506696615368
          },
          "before": 1,
          "after": 0,
          "evaluations": 1900,
          "samples": 1
        }
      ]
    }
  },
  "lambert-two": {
    "double": {
      "config": {
        "method": "lambert-two",
        "height": 1.5,
        "bias": 1,
        "blend": 0
      },
      "objective": "hemisphere-cuts",
      "results": [
        {
          "distance": 0,
          "angles": {
            "lon": -32.30610191412268,
            "lat": -32.063330167477375,
            "roll": 158.64937123842537
          },
          "before": 0.1413858413696287,
          "after": 0.012196917376519748,
          "evaluations": 2074,
          "samples": 20480
        },
        {
          "distance": 1,
          "angles": {
            "lon": -27.88110191412261,
            "lat": -30.638330167477363,
            "roll": 158.64937123842537
          },
          "before": 0.24583330154418945,
          "after": 0.04458968006865305,
          "evaluations": 2194,
          "samples": 20480
        },
        {
          "distance": 2,
          "angles": {
            "lon": 92.96773333624003,
            "lat": 13.79620816624049,
            "roll": 46.87679040580997
          },
          "before": 0.29416704177856445,
          "after": 0.06346287039622381,
          "evaluations": 2170,
          "samples": 20480
        },
        {
          "distance": 3,
          "angles": {
            "lon": 159.33776979669938,
            "lat": 48.180795999264774,
            "roll": -170.95786229074002
          },
          "before": 0.33750019073486326,
          "after": 0.08568915863865319,
          "evaluations": 2242,
          "samples": 20480
        },
        {
          "distance": 4,
          "angles": {
            "lon": -144.3690025046468,
            "lat": 53.32619559202158,
            "roll": 33.654580604285
          },
          "before": 0.3800004005432129,
          "after": 0.11077250068660438,
          "evaluations": 2170,
          "samples": 20480
        },
        {
          "distance": 5,
          "angles": {
            "lon": -142.83937047980726,
            "lat": 54.24778709025509,
            "roll": 31.5798652600497
          },
          "before": 0.4423959732055664,
          "after": 0.12429278528039775,
          "evaluations": 2218,
          "samples": 20480
        },
        {
          "distance": 6,
          "angles": {
            "lon": -50.096669778227806,
            "lat": 41.2421563407122,
            "roll": 134.47246523872013
          },
          "before": 0.4783330917358398,
          "after": 0.15048196422164242,
          "evaluations": 2224,
          "samples": 20480
        },
        {
          "distance": 7,
          "angles": {
            "lon": -51.671669778227795,
            "lat": 39.89215634071229,
            "roll": 134.62246523872022
          },
          "before": 0.519999885559082,
          "after": 0.16687909913602322,
          "evaluations": 2194,
          "samples": 20480
        },
        {
          "distance": 8,
          "angles": {
            "lon": -52.796669778227795,
            "lat": 41.31715634071213,
            "roll": 134.54746523872018
          },
          "before": 0.5591671943664551,
          "after": 0.20555119696649285,
          "evaluations": 2200,
          "samples": 20480
        },
        {
          "distance": 9,
          "angles": {
            "lon": -152.4144704528153,
            "lat": 50.23666433516473,
            "roll": 30.999616473913193
          },
          "before": 0.5958335876464844,
          "after": 0.2906055995592915,
          "evaluations": 2218,
          "samples": 20480
        }
      ]
    }
  }
};
