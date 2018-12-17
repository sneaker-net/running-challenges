// Global variable for the main map
var mymap

var special_event_layers = {}

var available_times = []

var time_markers = []

function special_event_on_change(e) {
  console.log("Something changed")
  // console.log(e)

  // Find the current event type we are showing
  var e = document.getElementById("slidemenu_special_event_type_name");
  if (e !== null && e !== undefined) {
    selected_event_type_name = e.options[e.selectedIndex].value;
    console.log("Trying to add the events for: "+selected_event_type_name)
  } else {
    return
  }

  // Find the appropriate times
  var events_by_time = {}

  Object.keys(parkrun_data_special_events[selected_event_type_name]['events']).forEach(function(special_event_name) {
    special_event_info = parkrun_data_special_events[selected_event_type_name]['events'][special_event_name]
    if (!(special_event_info["time"] in events_by_time)) {
      events_by_time[special_event_info["time"]] = []
    }
    events_by_time[special_event_info["time"]].push(special_event_info)
  })
  console.log(events_by_time)

  // if (Object.keys(events_by_time).length == 0) {
  //   console.log("No events available")
  //   return
  // }

  var option_counter = 0
  var checked_time_options = {}
  var applicable_parkrun_events = {}
  var time_to_marker_map = {}
  Object.keys(events_by_time).sort().forEach(function(special_event_time) {

    var this_option_id = "time_select_input_"+option_counter
    var o = document.getElementById(this_option_id);
    if (o.checked) {
      checked_time_options[o.value] = true
      events_by_time[special_event_time].forEach(function(applicable_parkrun_event) {
        // console.log(applicable_parkrun_event)
        applicable_parkrun_events[applicable_parkrun_event['shortname']] = applicable_parkrun_event
      })
    }
    time_to_marker_map[special_event_time] = time_markers[option_counter]
    option_counter += 1
  })

  console.log(checked_time_options)
  console.log(applicable_parkrun_events)

  // Look for layers that we have added that we need to remove
  Object.keys(special_event_layers).forEach(function(special_event_type_name) {
    Object.keys(special_event_layers[special_event_type_name]).forEach(function(start_time) {
      // Remove all of those for the wrong event type
      if (special_event_type_name != selected_event_type_name) {
        console.log("Removing layer for the wrong event: " + special_event_type_name)
        mymap.removeLayer(special_event_layers[special_event_type_name][start_time])
        delete special_event_layers[special_event_type_name][start_time]
      // Remove those for the wrong time slot (they will be the right event here)
      } else if (!(start_time in checked_time_options)) {
        console.log("Removing layer for the wrong time: " + start_time)
        mymap.removeLayer(special_event_layers[special_event_type_name][start_time])
        delete special_event_layers[special_event_type_name][start_time]
      }
    })
  })

  // If this event is not in the layer cache, create a placeholder
  if (!(selected_event_type_name in special_event_layers)) {
    special_event_layers[selected_event_type_name] = {}
  }

  Object.keys(events_by_time).forEach(function(start_time) {
    if (start_time in checked_time_options) {
      // If it is not in the cache it hasn't been added, so we need to add it
      if (!(start_time in special_event_layers[selected_event_type_name])) {
        console.log("Adding markers for events at "+start_time)
        var newLayer = L.layerGroup()

        console.log(events_by_time[start_time])
        events_by_time[start_time].forEach(function(applicableEvent) {
          if (applicableEvent.shortname in parkrun_data_geo.events_5k) {
            var e = parkrun_data_geo.events_5k[applicableEvent.shortname]
            // console.log(e)
            // Add a marker to the layer
            var lat_lon = [e.latitude, e.longitude]

            var popup = e.local_name+" @ "+start_time
            // console.log(popup)
            var marker = L.marker(lat_lon, {icon: time_to_marker_map[start_time]}).bindPopup(popup);

            marker.addTo(newLayer)
          }
        })

        newLayer.addTo(mymap)
        special_event_layers[selected_event_type_name][start_time] = newLayer
      } else {
        console.log("Skipping already cached markers for events at "+start_time)
      }
    } else {
      console.log("Skipping markers for events at "+start_time)
    }
  })

  // parkrun_data_geo.events_5k.forEach(function(parkrun_event) {
  //   // console.log(parkrun_event.name)
  //   if (parkrun_event.name in applicable_parkrun_events) {
  //     var lat_lon = [parkrun_event.latitude, parkrun_event.longitude]
  //     // Default marker for the moment
  //     var marker = L.marker(lat_lon).addTo(mymap)
  //   }
  // })

}

function draw_map(map_id) {
  // Create the map centred on Bushy
  var bushy = [51.410992, -0.335791]
  mymap = L.map(map_id).setView(bushy, 13);

  // Define, and use, the openstreetmap tiles
  var tilelayer_openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })
  tilelayer_openstreetmap.addTo(mymap)

  // Create a set of markers
  var marker_colours = [
    'red',
    'orange-dark',
    'orange',
    'yellow',
    'blue-dark',
    'cyan',
    'purple',
    'violet',
    'pink',
    'green-dark',
    'green'
  ]
  marker_colours.forEach(function(colour) {
    time_markers.push(
      L.ExtraMarkers.icon({
        markerColor: colour,
        shape: 'circle'
      })
    )
  })

  // Allow the user to make the map go fullscreen
  mymap.addControl(new L.Control.Fullscreen())
  mymap.addControl(new L.Control.SideMenu({
    special_event_data: parkrun_data_special_events,
    callback: special_event_on_change
  }))

  console.log(parkrun_data_geo)
  console.log(parkrun_data_special_events)

  special_event_on_change()

}
