export default buttonMeta;
export namespace Primary {
    namespace args {
        let primary: boolean;
        let label: string;
    }
}
export namespace Secondary {
    export namespace args_1 {
        let label_1: string;
        export { label_1 as label };
    }
    export { args_1 as args };
}
export namespace Large {
    export namespace args_2 {
        export let size: string;
        let label_2: string;
        export { label_2 as label };
    }
    export { args_2 as args };
}
export namespace Small {
    export namespace args_3 {
        let size_1: string;
        export { size_1 as size };
        let label_3: string;
        export { label_3 as label };
    }
    export { args_3 as args };
}
declare namespace buttonMeta {
    export let title: string;
    export { Button as component };
    export namespace parameters {
        let layout: string;
    }
    export let tags: string[];
    export namespace argTypes {
        namespace backgroundColor {
            let control: string;
        }
    }
    export namespace args_4 {
        let onClick: import("@vitest/spy").Mock<any, any>;
    }
    export { args_4 as args };
}
import { Button } from './Button';
