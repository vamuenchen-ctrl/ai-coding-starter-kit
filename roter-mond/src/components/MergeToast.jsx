import { useSyncEngine } from '../context/SyncEngineContext'

export default function MergeToast() {
  const { mergeHinweis } = useSyncEngine()

  if (!mergeHinweis) return null

  return (
    <div className="merge-toast" role="status">
      Änderungen von anderem Gerät übernommen
    </div>
  )
}
