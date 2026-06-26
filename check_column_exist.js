const mainUrl = "https://tpdsnomwjuzgzvyxehpc.supabase.co/rest/v1/";
const mainKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZHNub213anV6Z3p2eXhlaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjk0NjcsImV4cCI6MjA5NDc0NTQ2N30.1KQAYw6D0HU-HihpXtbsIDcsyM347pa3XMFyXCfzclQ";

async function run() {
  const res = await fetch(`${mainUrl}AccountChecking?id=eq.189`, {
    method: "PATCH",
    headers: {
      "apikey": mainKey,
      "Authorization": `Bearer ${mainKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      "Transporter Bill Image": "https://jcgmyvxcamstnhuwmemc.supabase.co/storage/v1/object/public/image/transporter-bill-images/1781603229936_pmlg4.pdf"
    })
  });
  console.log("Response Status:", res.status);
  try {
    const data = await res.json();
    console.log("Response Body:", data);
  } catch (e) {
    console.log("No JSON body in response");
  }
}

run().catch(console.error);
