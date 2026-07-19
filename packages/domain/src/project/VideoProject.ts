import { Character } from "../character/Character";
import { Scene } from "../scene/Scene";
import { Story } from "../story/Story";

export interface VideoProject {

    id: string;

    prompt: string;

    platform: string;

    language: string;

    humor: string;

    style: string;

    story: Story;

    scenes: Scene[];

    characters: Character[];

}