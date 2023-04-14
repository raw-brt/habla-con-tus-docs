interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col mx-4 md:mx-0 w-full h-full justify-center items-center space-y-10">
      <div className="w-full h-full flex justify-center items-start">
        <main className="flex w-full flex-1 flex-col overflow-hidden justify-start items-center">
          {children}
        </main>
      </div>
    </div>
  );
}
