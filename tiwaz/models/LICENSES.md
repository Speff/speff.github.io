# Model licenses

`asaro.glb` is omitted from this public build: it's under a personal, non-commercial
EULA (see its row below), so it isn't shipped here, only on the private deploy.

Every shape in the library is built procedurally in `src/models/primitives.ts` except the one
file below. The downloaded CC0/CC-BY models that used to ship here (`fox.glb`, `figure.glb`,
`car.glb`, `plant.glb`, and earlier `dog.glb`) were dropped on 2026-09-20: they are modelled
objects, and reading their shading meant reading a modeller's topology and silhouette decisions
rather than an ideal form. See ARCHITECTURE.md, "The model library and the shading flag". Their
license rows are in this file's git history if one is ever brought back.

`asaro.glb` is the exception, and stays for the opposite reason: its planes *are* the subject.

The file is single-mesh, POSITION-only geometry (no materials, textures, skins or animations —
the app discards those on load and only uses triangle positions). The format is `.glb`
(glTF 2.0 binary), not Draco-compressed. The triangle count was computed by summing
`indices.count / 3` across all mesh primitives in the file's JSON chunk.

| File | Subject | Triangles | Author | License | Source |
|---|---|---|---|---|---|
| `asaro.glb` | Asaro planar head (John Asaro's "Planes of the Head" study cast) | 158,556 | Adam Fisher | Custom store EULA — personal, non-commercial use; check its terms before shipping this file in a public build | https://afisher.com.au/store/Wrb61/asaro-planes-of-the-head |

Total size: 2.85 MB.

## Processing

`asaro.glb` was converted from Adam Fisher's ZBrush OBJ export (kept locally in `reference/`,
gitignored) by `scripts/obj2glb.mjs`, positions and indices only — `prepareGeometry` rebuilds
normals regardless. A previously shipped Lee Perry-Smith head scan (CC BY 3.0) was removed
before that.

Because the EULA is personal and non-commercial, this file is kept out of the public GitHub
Pages build two ways: `src/models/library.ts` drops its entry when `VITE_PUBLIC_BUILD=1`, and
`scripts/publicBuild.mjs` deletes the file from `dist/` afterwards and notes the omission here.
