"use client"

import { useState, useEffect } from "react"
import ProductCard from "@/components/ProductCard"
import { getProducts } from "@/lib/firebase/products"
import { getDownloadUrlForFile } from "@/lib/firebase/storage"
import type { Product } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pdfCatalogUrl, setPdfCatalogUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadProducts()
    loadPdfCatalogUrl()
  }, [])

  const loadProducts = async () => {
    try {
      setError("")
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error: any) {
      console.error("Error al cargar productos:", error)
      setError(error.message || "Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }

  const loadPdfCatalogUrl = async () => {
    try {
      const url = await getDownloadUrlForFile("catalogs/santis_catalog.pdf")
      setPdfCatalogUrl(url)
    } catch (err) {
      console.error("Error loading PDF catalog URL:", err)
      setPdfCatalogUrl(null)
    }
  }

  const handleDownloadPdf = async () => {
    if (!pdfCatalogUrl) {
      console.error("PDF catalog URL is not available.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(pdfCatalogUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Catálogo de Productos Santi\'s.pdf'; // Filename for the download
      document.body.appendChild(a);
      a.click(); // Programmatically click the link to trigger download
      a.remove(); // Remove the element after clicking
      window.URL.revokeObjectURL(url); // Clean up the temporary URL
    } catch (err) {
      console.error("Error during PDF download:", err);
      setError("Error al descargar el catálogo. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Navegación */}
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-900 mb-4">Nuestros Productos</h1>
          <p className="text-xl text-orange-700 max-w-2xl mx-auto">
            Explora nuestra colección cuidadosamente seleccionada de materiales educativos inspirados en Montessori.
          </p>
          {pdfCatalogUrl && (
            <div className="mt-6">
              <Button
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? "Descargando..." : "¡Descarga nuestro catálogo!"}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-orange-700">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error al Cargar Productos</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button onClick={loadProducts} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                Intentar de Nuevo
              </button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">No Hay Productos</h3>
              <p className="text-orange-700">
                Aún no hay productos disponibles. Vuelve pronto para ver nuestras novedades.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}