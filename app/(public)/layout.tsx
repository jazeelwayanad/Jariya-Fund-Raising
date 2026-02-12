

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-background max-w-[520px] mx-auto shadow-2xl border-x">
            <main className="flex-1">{children}</main>
        </div>
    )
}
