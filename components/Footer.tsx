import Link from "next/link";

export function Footer() {
    return (
        <>
            <footer className="container py-3 mb-4 text-center text-[10px] font-bold text-gray-800 flex justify-center gap-6 bg-white">
                <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary">Terms of Service</Link>
                <Link href="#" className="hover:text-primary">About Us</Link>
            </footer>
            <div className="text-center text-[9px] text-gray-500 pb-6 font-medium">
                © Sabeelul Hidaya Islamic College
            </div>
        </>
    )
}
