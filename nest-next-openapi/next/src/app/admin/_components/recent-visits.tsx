import Link from 'next/link'

export function RecentVisits({ links }: { links: any[any] }) {
  return (
    <div className="space-y-8">
      {links.slice(0, 5).map((item: any) => (
        <Link
          href={`/app/links/${item.id}`}
          key={item.id}
          className="flex items-center justify-between hover:text-accent hover:underline"
        >
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.customAlias || item.originalUrl}
              </p>
            </div>
          </div>
          <div className="font-medium">{item._count.visits} Visits</div>
        </Link>
      ))}
    </div>
  )
}
