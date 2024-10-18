import Footer from "./components/footer";

export default function Page() {

  return ( 
    <div className="flex flex-col h-full w-full overflow-y-scroll">
      <div className="w-screen p-16 md:p-24 grid md:grid-cols-2 gap-16 md:gap-24">
        {/* <a href={'/books'}> */}
        <div className="border-2 border-slate-500 rounded-lg w-full h-60 hover:bg-slate-700 hover:cursor-default flex align-middle justify-center">
          <div className="min-w-[50%]">
            <h2 className="text-3xl">Books</h2>
            <p className="text-right italic">-1246 items-</p>
          </div>
        </div>
        {/* </a> */}
        {/* <a href={'/biographies'}> */}
        <div className="border-2 border-slate-500 rounded-lg w-full h-60 hover:bg-slate-700 hover:cursor-default flex align-middle justify-center">
          <div className="min-w-[50%]">
            <h2 className="text-3xl">Biographies</h2>
            <p className="text-right italic">-1246 items-</p>
          </div>
        </div>
        {/* </a> */}
        {/* <a href={'/articles'}> */}
        <div className="border-2 border-slate-500 rounded-lg w-full h-60 hover:bg-slate-700 hover:cursor-default flex align-middle justify-center">
          <div className="min-w-[50%]">
            <h2 className="text-3xl">Articles</h2>
            <p className="text-right italic">-1246 items-</p>
          </div>
        </div>
        {/* </a> */}
        <div className="border-2 border-slate-500 rounded-lg w-full h-60 hover:bg-slate-700 hover:cursor-default flex align-middle justify-center">
          <div className="min-w-[50%]">
            <h2 className="text-3xl">Users</h2>
            <p className="text-right italic">-1246 registered-</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}