import React from 'react';

interface NotFoundProps {
  title?: string;
  description?: React.ReactNode;
  linkHref?: string;
  linkLabel?: string;
}

const NotFound: React.FC<NotFoundProps> = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-7xl font-bold text-gray-800 dark:text-white">404</div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">Oops! Page not found.</h1>
      <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">
        This page doesn&rsquo;t exist or has been moved.
        <br />
        Please check the URL or return to the homepage.
      </p>
    </div>
  );
};

export default NotFound;
