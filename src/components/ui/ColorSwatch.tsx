interface ColorSwatchProps {
  color: string;
  shade: number;
  hex: string;
}

export function ColorSwatch({ color, shade, hex }: ColorSwatchProps) {
  const bgClass = `bg-${color}-${shade}`;
  
  return (
    <div className="space-y-2">
      <div 
        className={`h-20 rounded-lg ${bgClass} border border-neutral-200`}
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-neutral-900">
          {color}-{shade}
        </p>
        <p className="text-xs text-neutral-500">{hex}</p>
      </div>
    </div>
  );
}