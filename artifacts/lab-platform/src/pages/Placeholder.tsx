export default function ComponentPlaceholder({ name }: { name: string }) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{name}</h1>
      <div className="mt-6 p-12 border border-dashed rounded-lg bg-white/50 text-center flex flex-col items-center">
        <p className="text-muted-foreground mb-4">The {name} view has been generated successfully.</p>
        <p className="text-sm text-muted-foreground">Functionality to be implemented.</p>
      </div>
    </div>
  );
}
