import { ClientConfig } from '@handoff/types/config';

interface FooterProps {
  config: ClientConfig;
}

function Footer({ config }: FooterProps) {
  const date = new Date();
  return (
    <footer>
      <p className="fw-light pt-16 text-center text-xs text-gray-400 dark:text-gray-500">
        Copyright {config?.app?.client}, {date.getFullYear()}
        {config?.app?.attribution && (
          <>
            {' '}
            - Powered By{' '}
            <a href="https://www.handoff.com/" target="_blank" rel="noreferrer">
              Handoff
            </a>
          </>
        )}
      </p>
    </footer>
  );
}

export default Footer;
