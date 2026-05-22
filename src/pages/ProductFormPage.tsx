import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Product, Category } from '../types/api'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'keramika', label: 'Keramika' },
  { value: 'textil', label: 'Textil' },
  { value: 'vysivky', label: 'Výšivky' },
]

const IMAGE_FIELDS = ['image1', 'image2', 'image3'] as const
type ImageField = (typeof IMAGE_FIELDS)[number]

interface FormData {
  name_cs: string
  name_en: string
  description_cs: string
  description_en: string
  price: string
  category: Category
  stockCount: string
  active: boolean
}

const EMPTY_FORM: FormData = {
  name_cs: '',
  name_en: '',
  description_cs: '',
  description_en: '',
  price: '',
  category: 'keramika',
  stockCount: '1',
  active: true,
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/products/${id}`).then((r) => r.data),
    enabled: !isNew,
  })

  if (!isNew && isLoading) return <div className="p-8 text-sm text-gray-500">Načítám…</div>
  if (!isNew && !product) return <div className="p-8 text-sm text-red-500">Produkt nenalezen</div>

  return <ProductForm id={id!} isNew={isNew} product={product} />
}

function ProductForm({ id, isNew, product }: { id: string; isNew: boolean; product?: Product }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormData>(() =>
    product
      ? {
          name_cs: product.name_cs,
          name_en: product.name_en,
          description_cs: product.description_cs,
          description_en: product.description_en,
          price: String(product.price),
          category: product.category,
          stockCount: String(product.stockCount),
          active: product.active,
        }
      : EMPTY_FORM,
  )
  const [images, setImages] = useState<Partial<Record<ImageField, File>>>({})
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stockCount: parseInt(form.stockCount),
      }
      const { data } = isNew
        ? await api.post<Product>('/products', payload)
        : await api.put<Product>(`/products/${id}`, payload)

      await Promise.all(
        IMAGE_FIELDS.filter((f) => images[f]).map((field) => {
          const formData = new FormData()
          formData.append(field, images[field]!)
          return api.post(`/products/${data.id}/${field}`, formData)
        }),
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
    onError: () => setError('Uložení selhalo. Zkontrolujte vyplněné údaje.'),
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  function handleImageChange(field: ImageField) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) setImages((prev) => ({ ...prev, [field]: file }))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/products')} className="text-sm text-gray-500 hover:text-gray-900">
          ← Zpět
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? 'Nový produkt' : 'Upravit produkt'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Základní info</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Název (CZ)" name="name_cs" value={form.name_cs} onChange={handleChange} required />
            <Field label="Název (EN)" name="name_en" value={form.name_en} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextareaField label="Popis (CZ)" name="description_cs" value={form.description_cs} onChange={handleChange} />
            <TextareaField label="Popis (EN)" name="description_en" value={form.description_en} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Cena (Kč)" name="price" type="number" min="0" step="1" value={form.price} onChange={handleChange} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <Field label="Počet na skladě" name="stockCount" type="number" min="0" value={form.stockCount} onChange={handleChange} required />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Aktivní (zobrazit v e-shopu)</span>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fotografie</h2>
          <div className="grid grid-cols-3 gap-4">
            {IMAGE_FIELDS.map((field, i) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto {i + 1}{i === 0 && ' (hlavní)'}
                </label>
                {!isNew && (
                  <img
                    src={`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/products/${id}/${field}`}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange(field)}
                  className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs"
                />
                {images[field] && (
                  <p className="text-xs text-green-600 mt-1">{images[field]!.name}</p>
                )}
              </div>
            ))}
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
            onClick={() => navigate('/products')}
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

function TextareaField({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        {...props}
        rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
      />
    </div>
  )
}
