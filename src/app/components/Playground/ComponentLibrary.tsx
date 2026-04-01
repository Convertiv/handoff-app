import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { PlusIcon, Search, XIcon } from 'lucide-react';
import { usePlayground } from './PlaygroundContext';
import ComponentCard from './ComponentCard';

export default function ComponentLibrary() {
  const { components, addComponent } = usePlayground();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredComponents = components.filter(
    (component) =>
      (component.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedTags.length === 0 || component.tags?.some((tag) => selectedTags.includes(tag))) &&
      (selectedCategories.length === 0 || selectedCategories.includes(component.group))
  );

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Components</TooltipContent>
      </Tooltip>
      <SheetContent side="right" className="max-w-[400px] overflow-y-auto sm:max-w-[60vw]">
        <SheetHeader>
          <SheetTitle>Available Components</SheetTitle>
          <SheetDescription>Select and organize components for your page</SheetDescription>
        </SheetHeader>
        <div className="px-8">
          <div className="sticky top-0 z-10 -mt-6 mb-6 bg-background pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search components..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              {searchTerm && (
                <Button variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}>
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.length > 0 && (
                <div className="my-2 flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <span key={category} className="flex items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {category}
                      <button className="ml-1" onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== category))} type="button">
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedTags.length > 0 && (
                <div className="my-2 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="flex items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {tag}
                      <button className="ml-1" onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))} type="button">
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto">
            {filteredComponents.map((component, index) => (
              <ComponentCard
                key={component.id + index}
                component={component}
                onAdd={async (c) => {
                  await addComponent(c);
                }}
                onCategoryClick={(category) => setSelectedCategories([...selectedCategories, category])}
                onTagClick={(tag) => setSelectedTags([...selectedTags, tag])}
              />
            ))}
            {filteredComponents.length === 0 && <div className="py-8 text-center text-muted-foreground">No components found matching your search.</div>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
