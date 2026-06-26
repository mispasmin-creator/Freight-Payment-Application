const mainUrl = "https://tpdsnomwjuzgzvyxehpc.supabase.co/rest/v1/";
const mainKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZHNub213anV6Z3p2eXhlaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjk0NjcsImV4cCI6MjA5NDc0NTQ2N30.1KQAYw6D0HU-HihpXtbsIDcsyM347pa3XMFyXCfzclQ";

async function run() {
  const res = await fetch(`${mainUrl}`, {
    headers: {
      "apikey": mainKey,
      "Authorization": `Bearer ${mainKey}`
    }
  });
  const data = await res.json();
  console.log(data);
}

run().catch(console.error);
