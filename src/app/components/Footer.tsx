import { ClientConfig } from "@handoff/types/config";

interface FooterProps {
  config: ClientConfig;
}

function Footer({ config }: FooterProps) {
  const date = new Date();
  return (
    <footer id="site-footer" className="c-site-footer">
      <div className="o-container-fluid">
        <p>
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
      </div>
    </footer>
  );
}

export default Footer;
