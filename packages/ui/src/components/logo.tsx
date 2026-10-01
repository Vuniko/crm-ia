import type * as React from "react";

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" width={512} height={512} viewBox="0 0 512 512" fill="none" aria-label="CRM IA Logo" {...props}>
		<rect x="48" y="48" width="416" height="416" rx="112" fill="currentColor" />
		<path d="M342 174c-22-24-51-36-86-36-67 0-118 50-118 118s51 118 118 118c35 0 65-12 87-37l-38-36c-13 14-29 21-49 21-36 0-63-28-63-66s27-66 63-66c19 0 35 7 48 20l38-36Z" fill="var(--background, white)" />
		<circle cx="363" cy="149" r="29" fill="var(--background, white)" />
	</svg>
);
export default Logo;
