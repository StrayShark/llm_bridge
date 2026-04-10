interface TableProps {
  data: Record<string, any>
  title?: string
}

export function Table({ data, title }: TableProps) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="mt-2">
      {title && (
        <div className="text-xs font-medium text-on-surface mb-1">{title}</div>
      )}
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-surface-container-high last:border-b-0">
              <td className="py-1.5 pr-3 text-on-surface-variant font-mono whitespace-nowrap">
                {key}
              </td>
              <td className="py-1.5 text-error font-mono break-all">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
