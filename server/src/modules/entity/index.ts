
import Actant from "../actant";

export default interface Entity extends Actant {
    data: {
        type: any; //keyof EntityTypes;
    };
}
