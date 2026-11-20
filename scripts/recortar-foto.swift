// Recorta el objeto principal de una foto (el vaso) y lo guarda como PNG con fondo transparente.
// Usa Vision de macOS (el mismo «aislar sujeto» de Fotos), sin descargas ni servicios externos.
// Uso: swift scripts/recortar-foto.swift entrada.(png|jpg|webp) salida.png
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
  FileHandle.standardError.write("uso: swift scripts/recortar-foto.swift entrada salida.png\n".data(using: .utf8)!)
  exit(1)
}
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])

guard let image = CIImage(contentsOf: input, options: [.applyOrientationProperty: true]) else {
  FileHandle.standardError.write("no se pudo leer \(input.path)\n".data(using: .utf8)!)
  exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: image)
do {
  try handler.perform([request])
} catch {
  FileHandle.standardError.write("Vision falló: \(error)\n".data(using: .utf8)!)
  exit(2)
}
guard let result = request.results?.first, !result.allInstances.isEmpty else {
  FileHandle.standardError.write("no se encontró un objeto en \(input.lastPathComponent)\n".data(using: .utf8)!)
  exit(3)
}

do {
  // Máscara suave del tamaño de la foto: el vaso con sus bordes de vidrio, sin el fondo
  let maskBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
  let mask = CIImage(cvPixelBuffer: maskBuffer)
  let blend = CIFilter(name: "CIBlendWithMask")!
  blend.setValue(image, forKey: kCIInputImageKey)
  blend.setValue(CIImage.empty(), forKey: kCIInputBackgroundImageKey)
  blend.setValue(mask, forKey: kCIInputMaskImageKey)
  guard let cut = blend.outputImage?.cropped(to: image.extent) else { exit(4) }
  let context = CIContext()
  try context.writePNGRepresentation(of: cut, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  print("recortado: \(output.path)")
} catch {
  FileHandle.standardError.write("no se pudo recortar: \(error)\n".data(using: .utf8)!)
  exit(5)
}
