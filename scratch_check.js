const purchaseUrl = "https://jcgmyvxcamstnhuwmemc.supabase.co/rest/v1/";
const purchaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZ215dnhjYW1zdG5odXdtZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDgyODAsImV4cCI6MjA4NTU4NDI4MH0.wMKYEcXGOgrRwy7DKBlBz-a_mWhAuZaknG_iXYvKLLo";

async function run() {
  const fkRes = await fetch(`${purchaseUrl}fullkittin?select=*`, {
    headers: {
      "apikey": purchaseKey,
      "Authorization": `Bearer ${purchaseKey}`
    }
  });
  const fkData = await fkRes.json();
  
  console.log("Total entries in fullkittin:", fkData.length);
  const lf081 = fkData.filter(r => 
    String(r["Lift No"]).includes("081") || 
    String(r["Indent No"]).includes("081")
  );
  console.log("Entries in fullkittin with '081' in Lift No or Indent No:");
  console.log(JSON.stringify(lf081, null, 2));
}

run().catch(console.error);
