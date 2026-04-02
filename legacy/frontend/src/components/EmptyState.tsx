interface Props {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export default function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  )
}