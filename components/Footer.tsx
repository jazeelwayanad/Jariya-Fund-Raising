import Link from "next/link";

export function Footer() {
    return (
        <>
            <footer className="w-full py-4 mb-4 text-center text-[10px] font-bold text-gray-800 flex justify-center gap-6 bg-white relative z-50">
                <Link href="/privacy" className="hover:text-[#115e59] cursor-pointer">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#115e59] cursor-pointer">Terms of Service</Link>
                <Link href="/about" className="hover:text-[#115e59] cursor-pointer">About Us</Link>
            </footer>
            <div className="text-center text-[9px] text-gray-500 pb-6 font-medium">
                © Sabeelul Hidaya Islamic College
                <br />
                Developed by <Link href="https://jazeelwayanad.me" target="_blank" className="hover:text-[#115e59] cursor-pointer">Jazeel Wayanad</Link>
            </div>
        </>
    )
}
