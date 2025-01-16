import { cn } from '@/lib/utils';

type ColorGridProps = {
  title: string;
  description: string;
  colors: {
    id: string;
    name: string;
    machineName: string;
    value: string;
    blend: string;
    group: string;
    sass: string;
    reference: string;
  }[];
};
const ColorGrid: React.FC<ColorGridProps> = ({ title, description, colors }) => {
  return (
    <>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="mb-8">{description}</p>
      {colors.length < 5 ? (
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,300px))] gap-6">
          {colors.map((color) => (
            <a href="#" className="flex flex-col items-start">
              <div
                className="mb-2 block h-32 w-full rounded-lg"
                style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
              ></div>
              <p className="mb-1 text-sm font-medium">{color.name}</p>
              <small className="font-mono text-xs font-light text-gray-400">{color.value}</small>
            </a>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(70px,70px))] gap-6">
          {colors.map((color) => (
            <a href="" className="flex flex-col">
              <div
                className="mb-2 block h-14 rounded-lg"
                style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
              ></div>
              <p className="mb-1 text-sm font-medium">{color.name}</p>
              <small className="font-mono text-xs font-light text-gray-400">{color.value}</small>
            </a>
          ))}
        </div>
      )}
    </>
  );
};
export default ColorGrid;
