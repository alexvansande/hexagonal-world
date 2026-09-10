// macOS-only preparation of the fixed PDF labels. No complete font files ship.
import Foundation
import CoreText
import CoreGraphics
let specifications = [
 ("title", "Baskerville-Italic", "Hexagonal World"),
 ("subtitle", "Gotham-Bold", "A COLLECTION OF HEXAGON BASED MAPS."),
 ("credit", "Baskerville", "By Alex Van de Sande - hexagonal.earth")
]
func number(_ n: CGFloat) -> String { String(format: "%.3f", Double(n)).replacingOccurrences(of: #"\.?0+$"#, with: "", options: .regularExpression) }
func point(_ p: CGPoint) -> String { "\(number(p.x)) \(number(p.y))" }
var output: [String: Any] = [:]
for (key, name, text) in specifications {
 let font: CTFont
 if name == "Gotham-Bold" {
  let url=FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Fonts/Gotham-Bold.otf")
  guard let provider=CGDataProvider(url:url as CFURL), let face=CGFont(provider) else { fatalError("Cannot read Gotham Bold") }
  font=CTFontCreateWithGraphicsFont(face,1000,nil,nil)
 } else { font=CTFontCreateWithName(name as CFString,1000,nil) }
 let actual = CTFontCopyPostScriptName(font) as String
 guard actual == name else { fatalError("Expected \(name), got \(actual)") }
 var glyphs: [String: Any] = [:]
 let extra = key == "title" ? "Polar Boreal Temperate Warm Cold Mild/warm Arid Humid Shallow Deep Forest Climate zones Subtropical Tropical Abyssal Shelf Slope Lower slope Upper slope" : key == "credit" ? "Land Ocean" : ""
 for char in Set((text + extra).utf16).sorted() {
  var code = char, glyph: CGGlyph = 0, advance = CGSize.zero
  guard CTFontGetGlyphsForCharacters(font, &code, &glyph, 1) else { fatalError("Missing character \(char)") }
  CTFontGetAdvancesForGlyphs(font, .horizontal, &glyph, &advance, 1)
  var commands: [String] = [], current = CGPoint.zero
  if let path = CTFontCreatePathForGlyph(font, glyph, nil) {
   path.applyWithBlock { element in
    let e = element.pointee
    switch e.type {
    case .moveToPoint: commands.append(point(e.points[0])+" m"); current=e.points[0]
    case .addLineToPoint: commands.append(point(e.points[0])+" l"); current=e.points[0]
    case .addQuadCurveToPoint:
     let q=e.points[0], end=e.points[1]
     let a=CGPoint(x:current.x+(q.x-current.x)*2/3,y:current.y+(q.y-current.y)*2/3)
     let b=CGPoint(x:end.x+(q.x-end.x)*2/3,y:end.y+(q.y-end.y)*2/3)
     commands.append(point(a)+" "+point(b)+" "+point(end)+" c"); current=end
    case .addCurveToPoint: commands.append(point(e.points[0])+" "+point(e.points[1])+" "+point(e.points[2])+" c");current=e.points[2]
    case .closeSubpath: commands.append("h")
    @unknown default: fatalError("Unknown outline command")
    }
   }
  }
  if !commands.isEmpty { commands.append("f") }
  glyphs[String(char)] = ["width":Double(advance.width), "path":commands.joined(separator:"\n")]
 }
 let b=CTFontGetBoundingBox(font)
 output[key] = ["name":actual,"text":text,"bbox":[b.minX,b.minY,b.maxX,b.maxY],"glyphs":glyphs]
}
let data=try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys])
try data.write(to:URL(fileURLWithPath:"dist/pdf-lettering.json"))
print("Prepared Baskerville Italic, Gotham Bold and Baskerville vector glyphs for the fixed print labels.")
