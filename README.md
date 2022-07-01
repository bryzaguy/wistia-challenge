# Wistia Coding Challenge

| Browsers Tested | OS |
| ----------- | ----------- |
| Safari 15.4, Chrome 103.0.5060.53 | MacOS Monterey 12.3.1 |

# Architecture Overview
The architecture overall is pretty simple. Plain JavaScript, CSS and HTML on the frontend and, in addition to Wistia public APIs, Node service on the backend. The following sections break down design into more detail.

## Playlist
The DOM represents the source of truth for the playlist's state. To find the next media item to play, find the top media list item where `'playing'` overlay class is not present and `data-played`, the property for tracking if a media item has played, is not present or false.

Transitions and autoplay are triggered by video player loading, `'end'`, `'beforereplace'` and `'play'` events, which keeps behaviors decoupled. For example, toggling the "Playing" overlay on media via `'play'` and `'beforereplace'` events ties the overlay to both autoplay and clicking to play video events without mixing code paths.

The countdown timer is powered by `setInterval` and cancellable via `AbortController`, in case someone clicks on another video while in the middle of a countdown.

API requests happen concurrently and synchronize via `Promise.all(...)` for maximum speed.

## Hidden Media API
Simple API built using express in nodejs. I struggled deciding whether to go with `/medias` endpoints, returning an array of objects with a `hashed_id` and a `hidden` or `visible` property. Something similar to the actual `/medias` endpoint, which would make it easier to merge later.

Medias are visible by default, hiding requires an interaction, and hiding is what the feature focuses on so I went with `/hidden-medias` backed by an in memory object/hash data structure to minimize storage cost and simplify both endpoint internals and frontend usage.

The feature only requires two endpoints:
1. GET enpoint returns all hidden medias
2. PUT endpoint updates individual media visibility.

I skipped adding auth, project data segmentation, or rigorous validation.

## Dashboard
State of the visibility toggle has `data-value` set to either `'hidden'` or `'visible'` and `data-hashed-id`, which is all the necessary info to send a hide or unhide PUT request. This could result in a race condition if executed quickly leaving the UI in an incorrect state. Could potentially serialize requests to prevent issues. Reloading page could be suitable workaround given it's an edge case.

Medias and hidden media APIs are requested concurrently, synchronized via `Promise.all(...)`, mapped as concurrent Stats API requests, then synchronized via `Promise.all(...)` to render with consistent ordering.

## Tag Schema
- [x] Write a query to print the total number of videos with at least 1 play count
```sql
SELECT count(1) as videos_played_total FROM videos WHERE play_count > 0
```
- [x] Create the schema(s) to support tags

```sql
CREATE TABLE tags (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  description text
);

CREATE TABLE video_tags (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  videos_id integer REFERENCES videos (id),
  tags_id integer REFERENCES tags (id),
  UNIQUE(videos_id, tags_id)
);
```

- [x] Write a query to find the video with the most number of tags. If more than one video have the same number of tags, print the one (note: assuming one refers to video) created most recently.

Here's the sample `video` schema:
```sql
CREATE TABLE videos (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  description text,
  created_at timestamp,
  play_count integer,
  other stuff...
);
```

And here's the query:
```sql
SELECT * FROM videos JOIN (
  SELECT videos_id, COUNT(1) AS tag_count
  FROM video_tags
  GROUP BY videos_id
  ORDER BY COUNT(1) DESC
) AS video_tag_counts
  ON videos_id = videos.id
ORDER BY tag_count DESC, created_at DESC
LIMIT 1
```

# Performance Characteristics
**Browser:** Fast execution times and low memory usage are due to minimal DOM and event handlers, targeted DOM manipulations, few assets, no frameworks (frameworks like React can add 3-6 seconds to initial page load).

 > *Possible Enhancements:*
 >
 > Countdown screen thumbnails are occasionally slow to load, displaying a blank box. Prefetching could make it feel snappier. [Windowing](https://www.patterns.dev/posts/virtual-lists/) large playlists could improve render performance. Lastly, a single endpoint returning stats for all medias would dramatically reduce the number of API requests to get play counts.

**Backend:** The endpoints contain no blocking code and use an in memory object for storage. The result is low memory utilization and fast execution times.

# Learnings and Regrets (i.e. What I'd do differently)
I learned a ton about your APIs reading the docs. Like, a lot. Phew. I had a lot of fun, though. No regrets!

# Notes
* **Added but not in Feature Specifications:**
  1. Added video title under playing video, like in the mockup. On the job, I'd check if the mockup was correct.
  2. Play count is now populated via the stats API because the question mark placeholder really bugged me. Willy nilly wiring of API's is not my operating mode. On the job, I'd make sure it is the correct data source.
  3. Animate playlist when moving played videos to the bottom of the queue helps the user understand how the playlist is changing. It's disorienting otherwise. On the job, I'd get feedback from Design.
* I considered putting in a sqlite in memory backend for the Tags part of the challenge but, frankly, ran out of steam.