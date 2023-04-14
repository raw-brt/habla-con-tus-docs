import { ReactNode, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { queryClientConfig } from "@/src/utils/reactQueryClient";
import { QueryClientProvider } from "@tanstack/react-query";

const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(queryClientConfig);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={true} />
      <Toaster />
    </QueryClientProvider>
  );
};

export default Providers;
