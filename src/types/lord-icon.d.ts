/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          trigger?: string;
          stroke?: string;
          colors?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
