#!/usr/bin/env bash
# Fills the local compose stack with a realistic catalogue through the public API: approved Venues with Seated and
# General Admission Sections, and published Events with priced, upcoming Shows in several cities.
#
# Usage: docker compose up -d --build --wait && scripts/seed.sh
#
# It signs in as the dev `organizer` and `platform-admin` users and never touches the database directly. Running it
# again is safe: Venues and Events are found by name, anything a previous run left half-done is finished, and Shows are
# only added where an Event has fewer upcoming Shows at a Venue than listed below. Needs curl and jq.
set -euo pipefail

API_URL=${API_URL:-http://localhost:8080}
KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:8180}

# Every seed Venue is in India, so Show times below are local times at UTC+05:30.
IST_OFFSET_SECONDS=19800

SEED=$(cat <<'JSON'
{
  "venues": [
    {
      "name": "Royal Opera House", "address": "Mama Parmanand Marg, Girgaon", "city": "Mumbai",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "Stalls", "kind": "SEATED", "pricePaise": 250000,
          "rows": [ { "label": "A", "seatCount": 14 }, { "label": "B", "seatCount": 14 },
                    { "label": "C", "seatCount": 16 }, { "label": "D", "seatCount": 16 } ] },
        { "name": "Balcony", "kind": "SEATED", "pricePaise": 120000,
          "rows": [ { "label": "E", "seatCount": 10 }, { "label": "F", "seatCount": 10 } ] }
      ]
    },
    {
      "name": "Mahalaxmi Racecourse Grounds", "address": "Keshavrao Khadye Marg, Mahalaxmi", "city": "Mumbai",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "VIP Enclosure", "kind": "GENERAL_ADMISSION", "capacity": 200, "pricePaise": 600000 },
        { "name": "General Admission", "kind": "GENERAL_ADMISSION", "capacity": 2000, "pricePaise": 150000 }
      ]
    },
    {
      "name": "Phoenix Marketcity Arena", "address": "Whitefield Main Road, Mahadevapura", "city": "Bengaluru",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "Front Rows", "kind": "SEATED", "pricePaise": 350000,
          "rows": [ { "label": "A", "seatCount": 16 }, { "label": "B", "seatCount": 16 },
                    { "label": "C", "seatCount": 16 } ] },
        { "name": "Standing", "kind": "GENERAL_ADMISSION", "capacity": 600, "pricePaise": 180000 }
      ]
    },
    {
      "name": "Siri Fort Auditorium", "address": "August Kranti Marg, Siri Fort", "city": "New Delhi",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "Orchestra", "kind": "SEATED", "pricePaise": 200000,
          "rows": [ { "label": "A", "seatCount": 20 }, { "label": "B", "seatCount": 20 },
                    { "label": "C", "seatCount": 20 }, { "label": "D", "seatCount": 20 } ] },
        { "name": "Gallery", "kind": "GENERAL_ADMISSION", "capacity": 150, "pricePaise": 80000 }
      ]
    },
    {
      "name": "Balewadi Stadium", "address": "Mahalunge Road, Balewadi", "city": "Pune",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "East Stand", "kind": "SEATED", "pricePaise": 220000,
          "rows": [ { "label": "A", "seatCount": 25 }, { "label": "B", "seatCount": 25 },
                    { "label": "C", "seatCount": 25 } ] },
        { "name": "Field", "kind": "GENERAL_ADMISSION", "capacity": 1500, "pricePaise": 120000 }
      ]
    },
    {
      "name": "Shilpakala Vedika", "address": "HITEC City Main Road, Madhapur", "city": "Hyderabad",
      "timeZone": "Asia/Kolkata",
      "sections": [
        { "name": "Main Hall", "kind": "SEATED", "pricePaise": 150000,
          "rows": [ { "label": "A", "seatCount": 18 }, { "label": "B", "seatCount": 18 },
                    { "label": "C", "seatCount": 18 }, { "label": "D", "seatCount": 18 } ] },
        { "name": "Standing Room", "kind": "GENERAL_ADMISSION", "capacity": 100, "pricePaise": 60000 }
      ]
    }
  ],
  "events": [
    {
      "title": "Neon Monsoon: The Homecoming Tour", "category": "MUSIC", "language": "hi",
      "description": "The synth-pop trio play their new album live, with the old favourites in the encore.",
      "shows": [
        { "venue": "Mahalaxmi Racecourse Grounds", "at": "18:30", "inDays": [14] },
        { "venue": "Phoenix Marketcity Arena", "at": "19:00", "inDays": [21] },
        { "venue": "Balewadi Stadium", "at": "18:00", "inDays": [28] }
      ]
    },
    {
      "title": "Late Night Laughs", "category": "COMEDY", "language": "en",
      "description": "Four stand-up comics, one mic and no filter. Recommended for ages 18 and up.",
      "shows": [
        { "venue": "Royal Opera House", "at": "21:00", "inDays": [5, 6] },
        { "venue": "Shilpakala Vedika", "at": "20:30", "inDays": [12] }
      ]
    },
    {
      "title": "The Glass Menagerie", "category": "THEATRE", "language": "en",
      "description": "Tennessee Williams's memory play in a new production from a Delhi repertory company.",
      "shows": [
        { "venue": "Siri Fort Auditorium", "at": "19:30", "inDays": [9, 10, 11] }
      ]
    },
    {
      "title": "Kathak Nights", "category": "DANCE", "language": "hi",
      "description": "An evening of classical Kathak with live tabla and sarangi.",
      "shows": [
        { "venue": "Royal Opera House", "at": "19:00", "inDays": [16] },
        { "venue": "Phoenix Marketcity Arena", "at": "19:00", "inDays": [18] }
      ]
    },
    {
      "title": "Cricket Final Fan Park", "category": "SPORTS", "language": "en",
      "description": "Watch the final on a giant screen with food trucks, commentary and a crowd that knows the rules.",
      "shows": [
        { "venue": "Balewadi Stadium", "at": "14:00", "inDays": [7] },
        { "venue": "Mahalaxmi Racecourse Grounds", "at": "14:00", "inDays": [7] }
      ]
    },
    {
      "title": "Frontend India Summit", "category": "CONFERENCE", "language": "en",
      "description": "A day of talks on web performance, accessibility and design systems.",
      "shows": [
        { "venue": "Shilpakala Vedika", "at": "09:30", "inDays": [35] },
        { "venue": "Siri Fort Auditorium", "at": "09:30", "inDays": [42] }
      ]
    }
  ]
}
JSON
)

die() {
	echo "seed: $*" >&2
	exit 1
}

log() {
	echo "seed: $*"
}

# token USERNAME: an access token for a dev user.
token() {
	local response
	response=$(curl -sS -d grant_type=password -d client_id=getmyseat-dev-cli -d username="$1" -d password=password \
		"$KEYCLOAK_URL/realms/getmyseat/protocol/openid-connect/token") || die "can't reach Keycloak at $KEYCLOAK_URL"
	jq -er .access_token <<<"$response" 2>/dev/null || die "couldn't sign in as $1: $response"
}

# api METHOD PATH TOKEN [JSON]: the response body. Exits on anything but a 2xx.
api() {
	local args=(-sS -X "$1" "$API_URL/api/v1$2" -H "Authorization: Bearer $3" -w '\n%{http_code}')
	if [ -n "${4-}" ]; then args+=(-H 'Content-Type: application/json' -d "$4"); fi
	local response status
	response=$(curl "${args[@]}") || die "can't reach the API at $API_URL"
	status=${response##*$'\n'}
	response=${response%$'\n'*}
	if [ "$status" -ge 300 ]; then die "$1 $2 returned $status: $response"; fi
	printf '%s\n' "$response"
}

# api_all PATH TOKEN: every item of a paginated list, as one JSON array.
api_all() {
	local separator='?' page=0 items='[]' response
	case $1 in *\?*) separator='&' ;; esac
	while :; do
		# Bash 3.2 doesn't carry `set -e` into command substitutions, so stop explicitly.
		response=$(api GET "$1${separator}size=100&page=$page" "$2") || exit 1
		items=$(jq -c --argjson items "$items" '$items + .content' <<<"$response")
		page=$((page + 1))
		if [ "$page" -ge "$(jq .page.totalPages <<<"$response")" ]; then break; fi
	done
	printf '%s\n' "$items"
}

# ensure_venue SPEC: approves the Venue, creating and submitting it first if needed, and adds it with its Section
# Prices to VENUES.
ensure_venue() {
	local spec=$1 name id status detail section
	name=$(jq -r .name <<<"$spec")
	id=$(jq -r --arg name "$name" 'map(select(.name == $name))[0].id // empty' <<<"$MY_VENUES")
	if [ -z "$id" ]; then
		id=$(api POST /venues "$ORGANIZER" "$(jq -c '{name, address, city, timeZone}' <<<"$spec")" | jq -r .id)
		status=DRAFT
		log "created Venue $name"
	else
		status=$(jq -r --arg id "$id" 'map(select(.id == $id))[0].status' <<<"$MY_VENUES")
	fi

	if [ "$status" = DRAFT ] || [ "$status" = REJECTED ]; then
		detail=$(api GET "/venues/$id" "$ORGANIZER")
		while IFS= read -r section; do
			if ! jq -e --argjson section "$section" 'any(.sections[]; .name == $section.name)' <<<"$detail" >/dev/null; then
				api POST "/venues/$id/sections" "$ORGANIZER" "$(jq -c 'del(.pricePaise)' <<<"$section")" >/dev/null
			fi
		done < <(jq -c '.sections[]' <<<"$spec")
		api POST "/venues/$id/submit" "$ORGANIZER" >/dev/null
		status=PENDING_REVIEW
	fi
	if [ "$status" = PENDING_REVIEW ]; then
		api POST "/admin/venues/$id/approve" "$ADMIN" >/dev/null
		log "approved Venue $name"
	fi

	detail=$(api GET "/venues/$id" "$ORGANIZER")
	VENUES=$(jq -c --argjson spec "$spec" --argjson venues "$VENUES" '$venues + [{
		id, name,
		prices: [.sections[] as $section | {
			sectionId: $section.id,
			amountPaise: ($spec.sections[] | select(.name == $section.name) | .pricePaise),
			currency: "INR"
		}]
	}]' <<<"$detail")
}

# ensure_event SPEC: publishes the Event, creating it first if needed, and tops up its upcoming Shows.
ensure_event() {
	local spec=$1 title id status shows show_spec venue upcoming count day starts_at show show_id
	title=$(jq -r .title <<<"$spec")
	id=$(jq -r --arg title "$title" 'map(select(.title == $title))[0].id // empty' <<<"$MY_EVENTS")
	if [ -z "$id" ]; then
		id=$(api POST /events "$ORGANIZER" "$(jq -c '{title, description, category, language}' <<<"$spec")" \
			| jq -r .id)
		status=DRAFT
		log "created Event $title"
	else
		status=$(jq -r --arg id "$id" 'map(select(.id == $id))[0].status' <<<"$MY_EVENTS")
	fi
	if [ "$status" = DRAFT ]; then
		api POST "/events/$id/publish" "$ORGANIZER" >/dev/null
		log "published Event $title"
	fi

	# As the owner this lists every Show of the Event, drafts and past ones included.
	shows=$(api_all "/events/$id/shows" "$ORGANIZER")
	while IFS= read -r show_spec; do
		venue=$(jq -c --argjson show "$show_spec" '.[] | select(.name == $show.venue)' <<<"$VENUES")
		[ -n "$venue" ] || die "Event $title has a Show at unknown Venue $(jq -r .venue <<<"$show_spec")"
		upcoming=$(jq -c --argjson venue "$venue" '
			map(select(.venue.id == $venue.id and (.startsAt | sub("\\.[0-9]+"; "") | fromdate) > now))
			| sort_by(.startsAt)' <<<"$shows")
		count=0
		for day in $(jq -r '.inDays[]' <<<"$show_spec"); do
			show=$(jq -c --argjson i "$count" '.[$i] // empty' <<<"$upcoming")
			count=$((count + 1))
			if [ -z "$show" ]; then
				starts_at=$(jq -rn --argjson day "$day" --arg at "$(jq -r .at <<<"$show_spec")" \
					--argjson offset "$IST_OFFSET_SECONDS" \
					'(now + $day * 86400 | strftime("%Y-%m-%d")) + "T" + $at + ":00Z" | fromdate - $offset | todate')
				show=$(api POST "/events/$id/shows" "$ORGANIZER" \
					"$(jq -nc --arg venueId "$(jq -r .id <<<"$venue")" --arg startsAt "$starts_at" '{venueId: $venueId, startsAt: $startsAt}')")
			fi
			if [ "$(jq -r .status <<<"$show")" = DRAFT ]; then
				show_id=$(jq -r .id <<<"$show")
				api PUT "/shows/$show_id/prices" "$ORGANIZER" "$(jq -c '{prices}' <<<"$venue")" >/dev/null
				api POST "/shows/$show_id/publish" "$ORGANIZER" >/dev/null
				log "published Show of $title at $(jq -r .name <<<"$venue"), $(jq -r .startsAt <<<"$show")"
			fi
		done
	done < <(jq -c '.shows[]' <<<"$spec")
}

command -v curl >/dev/null || die "needs curl"
command -v jq >/dev/null || die "needs jq"
curl -sf "$API_URL/actuator/health/readiness" >/dev/null \
	|| die "the API at $API_URL isn't ready; start the stack with: docker compose up -d --build --wait"

ORGANIZER=$(token organizer)
ADMIN=$(token platform-admin)

MY_VENUES=$(api_all /venues/mine "$ORGANIZER")
VENUES='[]'
while IFS= read -r spec; do
	ensure_venue "$spec"
done < <(jq -c '.venues[]' <<<"$SEED")

MY_EVENTS=$(api_all /events/mine "$ORGANIZER")
while IFS= read -r spec; do
	ensure_event "$spec"
done < <(jq -c '.events[]' <<<"$SEED")

log "done: $(jq '.venues | length' <<<"$SEED") Venues and $(jq '.events | length' <<<"$SEED") Events are live at $API_URL"
