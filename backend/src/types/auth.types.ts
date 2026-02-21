export type Auth0TokenPayload = {
	"https://yardvark.netlify.app/roles": string[];
	"https://yardvark.netlify.app/signup-date": string;
	"https://yardvark.netlify.app/email": string;
	"https://yardvark.netlify.app/first-name": string;
	"https://yardvark.netlify.app/last-name": string;
	"https://yardvark.netlify.app/name": string;
	iss: string;
	sub: string;
	aud: string[];
	iat: number;
	exp: number;
	scope: string;
	azp: string;
};
