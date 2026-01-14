export interface Skills {
	Languages: string[];
	Frontend: string[];
	Backend: string[];
	"AI/ML": string[];
	Database: string[];
	"Cloud & DevOps": string[];
	Tools: string[];
}

export interface Achievement {
	title: string;
	description: string;
}

export interface Experience {
	title: string;
	company: string;
	website: string;
	start: string;
	end: string;
	bullets: string[];
}

export interface Education {
	degree: string;
	school: string;
	start: string;
	end: string;
	bullets: string[];
}

export interface Project {
	name: string;
	link?: string;
	bullets: string[];
}

export interface CV {
	name: string;
	email: string;
	phone: string;
	github: string;
	linkedin: string;
	website: string;
	summary: string;
	skills: Skills;
	achievements: Achievement[];
	experience: Experience[];
	education: Education[];
	projects: Project[];
}

export type Provider = "openai" | "claude" | "gemini";

export type GenerateBody = {
	cv: CV;
	jd: string;
	provider?: Provider;
	allowBold?: boolean;
};

export type CompileBody = {
	latex: string;
};
