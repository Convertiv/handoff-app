import { ArrowRight, Code2, FileCode2, LucideProps, PersonStanding } from 'lucide-react';
import { Button } from '../ui/button';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

type CardsWithIconsProps = {
  items: [
    {
      title: string;
      description: string;
      icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
      link: string;
      cta: string;
    },
  ];
};

const CardsWithIcons = ({ items }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
    {items.map((item, index) => (
      <a
        key={index}
        href={item.link}
        className="group rounded-lg border border-gray-200 p-7 transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
      >
        <div className="flex flex-col items-start gap-2">
          <item.icon className="h-5 w-5 text-gray-500 dark:text-gray-400 " strokeWidth={1.5} />
          <h3 className="text-base font-medium">{item.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</p>
          <Button variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
            {item.cta}
            <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </a>
    ))}
  </div>
);
export default CardsWithIcons;
