export async function kontigoFetch(path: string, body: any) {
  const res = await fetch(`${process.env.KONTIGO_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KONTIGO_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  return res.json();
}