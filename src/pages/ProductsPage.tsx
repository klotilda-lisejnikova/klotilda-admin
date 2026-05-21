import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, PaginatedResponse } from '../types/api'

const CATEGORY_LABELS: Record<string, string> = {
  keramika: 'Keramika',
  textil: 'Textil',
  vysivky: 'Výšivky',
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: () =>
      api.get<PaginatedResponse<Product>>(`/products?page=${page}&limit=20`).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: (product: Product) =>
      api.put(`/products/${product.id}`, { active: !product.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  function handleDelete(product: Product) {
    if (confirm(`Smazat produkt "${product.name_cs}"?`)) {
      deleteProduct.mutate(product.id)
    }
  }

  const products = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Produkty</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} produktů celkem</p>
        </div>
        <Link
          to="/products/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Přidat produkt
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Načítám…</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Název</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kategorie</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Cena</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sklad</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aktivní</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name_cs}</td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[product.category] ?? product.category}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{product.price.toLocaleString('cs-CZ')} Kč</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${product.stockCount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive.mutate(product)}
                        className={`inline-block w-10 h-5 rounded-full transition-colors ${
                          product.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={product.active ? 'Deaktivovat' : 'Aktivovat'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Upravit
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Žádné produkty
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Předchozí
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Další →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
