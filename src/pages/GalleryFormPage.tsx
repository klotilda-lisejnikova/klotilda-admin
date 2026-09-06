import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '../lib/services'
import type { GalleryItem, Category, GalleryRow } from '../types/api'

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '', label: '— bez kategorie —' },
  { value: 'keramika', label: 'Keramika' },
  { value: 'vysivka', label: 'Výšivka' },
  { value: 'linoryt', label: 'Linoryt' },
]

const ROWS: GalleryRow[] = [1, 2]

interface FormData {
  title_cs: string
  title_en: string
  category: Category | ''
  row: GalleryRow
  sortOrder: string
  active: boolean
}

const EMPTY_FORM: FormData = {
  title_cs: '',
  title_en: '',
  category: '',
  row: 1,
  sortOrder: '0',
  active: true,
}

export default function GalleryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'

  const { data: item, isLoading } = useQuery({
    queryKey: ['gallery-item', id],
    queryFn: () => services.gallery.getById(id!),
    enabled: !isNew,
  })

  if (!isNew && isLoading) return <div className="p-8 text-sm text-gray-500">Načítám…</div>
  if (!isNew && !item) return <div className="p-8 text-sm text-red-500">Položka nenalezena</div>

  return <GalleryForm id={id!} isNew={isNew} item={item} />
}

function GalleryForm({ id, isNew, item }: { id: string; isNew: boolean; item?: GalleryItem }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormData>(() =>
    item
      ? {
          title_cs: item.title_cs,
          title_en: item.title_en ?? '',
          category: item.category ?? '',
          row: item.row,
          sortOrder: String(item.sortOrder),
          active: item.active,
        }
      : EMPTY_FORM,
  )
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [error, setError] = useState('')

  const existingImages = item?.images ?? []

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        row: Number(form.row),
        sortOrder: parseInt(form.sortOrder) || 0,
      }
      const data = isNew
        ? await services.gallery.create(payload)
        : await services.gallery.update(id, payload)

      for (let i = 0; i < newFiles.length; i++) {
        await services.gallery.uploadImage(data.id, newFiles[i], existingImages.length + i)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      navigate('/gallery')
    },
    onError: () => setError('Uložení selhalo. Zkontrolujte vyplněné údaje.'),
  })

  const deleteImage = useMutation({
    mutationFn: (fileId: string) => services.gallery.deleteImage(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery-item', id] }),
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    setNewFiles(e.target.files ? Array.from(e.target.files) : [])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/gallery')}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Zpět
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? 'Nová fotka do galerie' : 'Upravit položku galerie'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Titulek (CZ)"
              name="title_cs"
              value={form.title_cs}
              onChange={handleChange}
              required
            />
            <Field
              label="Titulek (EN)"
              name="title_en"
              value={form.title_en}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie (badge)
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Řada</label>
              <select
                name="row"
                value={form.row}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {ROWS.map((r) => (
                  <option key={r} value={r}>
                    Řada {r}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Pořadí v řadě"
              name="sortOrder"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Zobrazit v galerii</span>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fotka</h2>

          {isNew ? (
            <p className="text-xs text-gray-500">Fotka se nahraje po uložení.</p>
          ) : existingImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {existingImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => deleteImage.mutate(image.id)}
                    disabled={deleteImage.isPending}
                    className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs text-red-600 hover:bg-white disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Zatím žádná fotka.</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {existingImages.length > 0 ? 'Nahradit / přidat fotku' : 'Nahrát fotku'}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs"
            />
            {newFiles.length > 0 && (
              <p className="text-xs text-green-600 mt-1">{newFiles.map((f) => f.name).join(', ')}</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-gray-900 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {save.isPending ? 'Ukládám…' : 'Uložit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/gallery')}
            className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  )
}
