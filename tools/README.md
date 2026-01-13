# Part Geometry Generator

Generates simplified wireframe 3D geometries for all parts in the catalog.

## Usage

```bash
# Generate all parts
node generate-part-geometries.js

# Generate specific category
node generate-part-geometries.js --category=engine

# Limit number of parts (for testing)
node generate-part-geometries.js --limit=100

# Custom output file
node generate-part-geometries.js --output=custom.json
```

## Shape Classification

Parts are classified into shapes based on their names:

| Pattern | Shape | Examples |
|---------|-------|----------|
| gasket, seal, shim | plate | Gaskets, seals |
| bearing | ring | Ball bearings, roller bearings |
| bolt, screw | bolt | Bolts with hex heads |
| washer | ring | Flat washers |
| spring | spring | Coil springs |
| pipe, tube, hose | pipe | Pipes, tubes |
| filter | cylinder | Oil filters, air filters |
| pump | box | Water pump, fuel pump |
| bracket, mount | bracket | L-brackets |
| rotor, disc | ring | Brake rotors |
| gear | cylinder | Gears |
| shaft | cylinder | Drive shafts |

## Output Format

```json
{
  "partNumber": "12345-67890",
  "partName": "OIL PUMP ASSEMBLY",
  "category": "engine",
  "shapeType": "box",
  "geometry": {
    "type": "box",
    "vertices": [[x,y,z], ...],
    "edges": [[v1,v2], ...]
  }
}
```

## Integration

The generated `parts-geometry.json` can be loaded by the web app to:
1. Display individual part wireframes when selected
2. Highlight specific parts in the 3D view
3. Show part previews in search results
