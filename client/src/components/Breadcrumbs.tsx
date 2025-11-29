import { Link } from "@tanstack/react-router";

import { Icons } from "../enums";
import { Icon } from "./Icon";

type Props = {
  items: { id: string; title: string; path: string }[];
};
export function Breadcrumbs({ items = [] }: Props) {


  return (
    <nav className="w-full text-xl max-h-fit">
      <ul className="w-full h-full flex flex-row gap-x-1">
        <li className="text-primary items-center flex gap-x-1">
          <Link
            className="text-primary items-center flex gap-x-1"
            to="/browser/{-$path}"
            params={{ path: "" }}
          >
            <span className={`${items.length > 0 ? "text-info-highlight" : ""}`}>Home</span>
            {items.length > 0 ? (
              <span>
                <Icon icon={Icons.arrowRight} />
              </span>
            ) : null}
          </Link>
        </li>
        {items.map((item, idx) => (
          <li

            key={item.id}
          >
            <Link
              className="flex items-center gap-x-1"
              to="/browser/{-$path}"
              params={{
                path: items
                  .slice(0, idx + 1)
                  .map((item) => item.path)
                  .join("/"),
              }}
            >
              <span className={`${idx < items.length - 1 ? "text-info-highlight" : "text-primary"}`}>{item.title}</span>
              {idx < items.length - 1 ? (
                <span>
                  <Icon icon={Icons.arrowRight} />
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
