import startCase from 'lodash/startCase';
import { ColorObject } from '../../../api';
import HeadersType from '../Typography/Headers';
type ColorGridProps = {
  title: string;
  group: string;
  description: string;
  colors: ColorObject[];
};

const LargeColorGrid: React.FC<{ colors: ColorObject[] }> = ({ colors }) => (
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
);

const SmallColorGrid: React.FC<{ colors: ColorObject[] }> = ({ colors }) => {
  // group colors by subgroup
  const groupedColors = colors.reduce(
    (acc, color) => {
      if (!acc[color.subgroup]) {
        acc[color.subgroup] = [];
      }
      acc[color.subgroup].push(color);
      return acc;
    },
    {} as Record<string, ColorObject[]>
  );
  return (
    <>
      {Object.entries(groupedColors).map(([subgroup]) => (
        <div className="mb-5">
          <HeadersType.H4 key={subgroup}>{startCase(subgroup.replaceAll('-', ' '))}</HeadersType.H4>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,60px))] gap-6">
            {groupedColors[subgroup].map((color) => (
              <>
                <a href="" className="flex flex-col">
                  <div
                    className="mb-2 block h-14 rounded-lg"
                    style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
                  ></div>
                  <p className="mb-1 text-sm font-medium">{color.name}</p>
                  <small className="font-mono text-xs font-light text-gray-400">{color.value}</small>
                </a>
              </>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

const ColorGrid: React.FC<ColorGridProps> = ({ title, description, colors, group }) => {
  return (
    <>
      <h3 className="mb-2 text-lg font-medium" id={`${group}-colors`}>
        {title}
      </h3>
      <p className="mb-8">{description}</p>
      {colors.length < 5 ? <LargeColorGrid colors={colors} /> : <SmallColorGrid colors={colors} />}
    </>
  );
};
export default ColorGrid;
