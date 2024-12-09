import React, { useState } from 'react';
import Icon from './Icon';
import Link from 'next/link';

type ComponentListObject = {
  id: string;
  version: string;
  title: string;
  type: string;
  group: string;
  tags: string[];
  description: string;
  properties: { [key: string]: any };
};

/**
 * Get the Component List
 * @returns Promise<ComponentListObject[]>
 */
export const getComponentList = async (): Promise<ComponentListObject[]> => {
  // Try to load the component from the public json
  let data = await fetch(`/api/components.json`).then((res) => res.json());
  console.log(data);
  return data as ComponentListObject[];
};

const ComponentSearch = ({}) => {
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState<ComponentListObject[]>([]);

  const filterList = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
    setSearch(event.currentTarget.value.toLowerCase().replace(/[\W_]+/g, ' '));
    // filter list by search
    const filteredList = list.filter((component) => {
      return component.title.toLowerCase().includes(search) || component.description.toLowerCase().includes(search);
    });
    setList(filteredList);
  }, []);

  React.useEffect(() => {
    getComponentList().then((data) => {
      console.log(data);
      setList(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!list) {
    return <p>{JSON.stringify(list)}No icons found</p>;
  }

  return (
    <>
      <div className="c-form-element c-form-element--fullwidth c-form-element--big">
        <div className="c-form-element__field">
          <div className="c-form-element__icon">
            <Icon name="search" className="o-icon" />
          </div>
          <input type="text" className="c-form-element__text" placeholder="Search icons..." onChange={filterList} />
        </div>
      </div>
      <p>
        <strong>{list.length}</strong> found
      </p>
      <div className="o-row">
        <div className="o-col-12@md">
          <div className="o-stack-1@md o-stack-1@lg">
            {list.length > 0 ? (
              list.map((component) => <DisplayComponent key={component.id} component={component} />)
            ) : (
              <div className="c-search-results">
                <Icon name="search-laptop" className="o-icon" />
                <h4>No icons found.</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const DisplayComponent: React.FC<{ component: ComponentListObject }> = ({ component }) => {
  return (
    <div>
      <Link href={`/components/single/${component.id}`}>
        <div className="c-card c-card--component-preview">
          <div className="o-row">
            <div className="o-col-12@md">
              <h4>
                {component.title} <span className="component-version">(v.{component.version})</span>
              </h4>
              <p>{component.description}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ComponentSearch;
