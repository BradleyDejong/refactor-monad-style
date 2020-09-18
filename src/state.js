import { compose, prop, lensProp, view, set } from "ramda";

// export const lastUpdatedSelector = s => s.lastUpdated;
const lastUpdatedLens = lensProp("lastUpdatedDate");
export const lastUpdatedSelector = view(lastUpdatedLens);
export const setLastUpdated = set(lastUpdatedLens);

export const selectors = {
  lastUpdated: lastUpdatedSelector,
};

export const initialState = compose(setLastUpdated(new Date()))({
  clicks: 0,
  totalClicks: 0,
  quote: "Ken is the best. -Ryan",
});
