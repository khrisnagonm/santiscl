"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { notFound } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { getProduct } from "@/lib/firebase/products"
import type { Product } from "@/lib/types"
import Link from "next/link"
import { marked } from "marked"
import { formatPriceCLP, getCategoryDisplay } from "@/lib/utils"

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined)

  const [isZoomed, setIsZoomed] = useState(false)
  const [transformOrigin, setTransformOrigin] = useState("center center")
  const zoomLevel = 2
  const imageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const loadProduct = async () => {
    try {
      setError("")
      const productData = await getProduct(params.id)
      if (!productData) {
        notFound()
      }
      setProduct(productData)
      if (productData.images && productData.images.length > 0) {
        setSelectedImage(productData.images[0])
      } else {
        setSelectedImage("/placeholder.svg")
      }
    } catch (error: any) {
      console.error("Error al cargar producto:", error)
      setError(error.message || "Error al cargar producto")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppRequest = () => {
    if (!product) return
    const message = `¡Hola! Estoy interesado/a en ${product.name}. ¿Podrías proporcionarme más información?`
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "1234567890"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageContainerRef.current) return

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setTransformOrigin(`${x}% ${y}%`)
  }

  const handleImageClick = () => {
    setIsZoomed(!isZoomed)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-700">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al Cargar Producto</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Link href="/products" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Volver a Productos
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const imagesToDisplay = product.images || []
  const mainImageUrl = selectedImage || imagesToDisplay[0] || "/placeholder.svg"

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <nav className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-orange-800">
              Santi's
            </Link>
            <div className="flex space-x-6">
              <Link href="/" className="text-orange-700 hover:text-orange-900 font-medium">
                Inicio
              </Link>
              <Link href="/products" className="text-orange-700 hover:text-orange-900 font-medium">
                Productos
              </Link>
              <Link href="/contact" className="text-orange-700 hover:text-orange-900 font-medium">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div
              ref={imageContainerRef}
              onClick={handleImageClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsZoomed(false)}
              className={`aspect-square relative bg-white rounded-lg overflow-hidden shadow-sm border border-orange-100
                ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}
              `}
            >
              <Image
                src={mainImageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-300 ease-out"
                style={{
                  transform: isZoomed ? `scale(${zoomLevel})` : "scale(1)",
                  transformOrigin: transformOrigin,
                }}
              />
            </div>

            {imagesToDisplay.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imagesToDisplay.slice(0, 10).map((image, index) => (
                  <div
                    key={index}
                    className={`aspect-square relative bg-white rounded-lg overflow-hidden cursor-pointer w-20 h-20
                      ${selectedImage === image ? "border-2 border-orange-500 shadow-md" : "border border-orange-100 hover:border-orange-300"}
                    `}
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=400&width=400"}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-orange-900 mb-3">{product.name}</h1>

              <div className="flex items-center gap-3 mb-4">
                {product.highlighted && (
                  <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium">
                    <span className="text-yellow-500 mr-1.5">⭐</span>
                    Destacado
                  </div>
                )}

                {product.category && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full">
                    {getCategoryDisplay(product.category)}
                  </span>
                )}
              </div>

              <p className="text-2xl font-semibold text-orange-700">{formatPriceCLP(product.price)}</p>
              {typeof product.stock === "number" && (
                <p className="text-sm text-orange-700 mt-1">Stock: {product.stock} unidad{product.stock === 1 ? "" : "es"}</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
              <h2 className="text-xl font-semibold text-orange-900 mb-3">Descripción</h2>
              <div
                className="text-orange-700 leading-relaxed prose prose-orange"
                dangerouslySetInnerHTML={{ __html: marked.parse(product.description || "", { breaks: true }) }}
              />
            </div>

            {product.ageRecommendation && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                <h2 className="text-xl font-semibold text-orange-900 mb-3">Edad Recomendada</h2>
                <p className="text-orange-700">{product.ageRecommendation}</p>
              </div>
            )}

            {product.dimensions && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                <h2 className="text-xl font-semibold text-orange-900 mb-3">Especificaciones</h2>
                <div
                  className="text-orange-700 leading-relaxed prose prose-orange"
                  dangerouslySetInnerHTML={{ __html: marked.parse(product.dimensions || "", { breaks: true }) }}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleWhatsAppRequest}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                size="lg"
              >
                Solicitar por WhatsApp
              </Button>
              <Button
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50 flex-1"
                size="lg"
              >
                Enviar Consulta
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
