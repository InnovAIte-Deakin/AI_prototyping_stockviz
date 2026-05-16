import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-[#5f5e5e] mb-8">Dashboard</h1>
      <p className="text-[#5a6060] mb-12">You are currently logged in.</p>
      
      <form action={signOut}>
        <Button 
          type="submit"
          className="bg-[#5f5e5e] text-white h-[56px] px-8 rounded-xl font-bold text-base hover:opacity-90 transition-all"
        >
          Sign Out
        </Button>
      </form>
    </div>
  );
};

export default DashboardPage;
