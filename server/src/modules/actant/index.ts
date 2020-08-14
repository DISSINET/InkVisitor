
type UUID = string;

export default interface Actant {
    id: UUID;
    label: string;
    class: "T" | "R" | "E" | "S"; // defines the model and the conntent of data object
}
