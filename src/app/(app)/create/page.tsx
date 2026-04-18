import { PaparanForm } from '@/components/Paparan/PaparanForm'

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-paparan-cream">
      <header className="bg-white border-b border-paparan-deep/10">
        <div className="container py-4">
          <h1 className="font-serif text-2xl text-paparan-deep">Create Paparan</h1>
          <p className="text-paparan-slate text-sm">Generate a new policy intelligence brief</p>
        </div>
      </header>

      <div className="container py-8">
        <PaparanForm />
      </div>
    </div>
  )
}
