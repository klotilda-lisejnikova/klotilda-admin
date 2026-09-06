import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { services } from '../lib/services'
import type { GalleryItem } from '../types/api'

const CATEGORY_LABELS: Record<string, string> = {
  keramika: 'Keramika',
  vysivka: 'Výšivka',
  linoryt: 'Linoryt',
}

const ROWS = [1, 2] as const

export default function GalleryPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => services.gallery.getAll().then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: (item: GalleryItem) => services.gallery.update(item.id, { active: !item.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => services.gallery.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
  })

  function handleDelete(item: GalleryItem) {
    if (confirm(`Smazat položku "${item.title_cs}"?`)) remove.mutate(item.id)
  }

  const items = data ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Galerie</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} položek · úvodní stránka, dvě řady
          </p>
        </div>
        <Link
          to="/gallery/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Přidat fotku
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Načítám…</div>
      ) : (
        <div className="space-y-8">
          {ROWS.map((row) => {
            const rowItems = items
              .filter((i) => i.row === row)
              .sort((a, b) => a.sortOrder - b.sortOrder)
            return (
              <div key={row}>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Řada {row}
                  <span className="ml-2 font-normal text-gray-400">
                    {rowItems.length} {rowItems.length > 3 ? '· scrolluje' : ''}
                  </span>
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-20"></th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Titulek</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Kategorie</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Pořadí</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Aktivní</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2">
                            {item.images[0] ? (
                              <img
                                src={item.images[0].url}
                                alt=""
                                className="h-12 w-12 object-cover rounded bg-gray-100"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-100" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.title_cs}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.category ? (CATEGORY_LABELS[item.category] ?? item.category) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{item.sortOrder}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleActive.mutate(item)}
                              className={`inline-block w-10 h-5 rounded-full transition-colors ${
                                item.active ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={item.active ? 'Deaktivovat' : 'Aktivovat'}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 justify-end">
                              <Link
                                to={`/gallery/${item.id}`}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                Upravit
                              </Link>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                Smazat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rowItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                            Řada je prázdná
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
