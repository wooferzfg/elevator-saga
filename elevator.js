{
  init: function(elevators, floors) {
    let upFloorsToVisit = [];
    let downFloorsToVisit = [];
    const elevatorStates = [];
    const elevatorDirections = [];

    const isGoingUp = (elevator) => {
      const elevatorIndex = elevators.indexOf(elevator);
      return elevatorDirections[elevatorIndex] === "up";
    };

    const isGoingDown = (elevator) => {
      const elevatorIndex = elevators.indexOf(elevator);
      return elevatorDirections[elevatorIndex] === "down";
    };

    const goUp = (elevator) => {
      const elevatorIndex = elevators.indexOf(elevator);
      elevatorDirections[elevatorIndex] = "up";
    };

    const goDown = (elevator) => {
      const elevatorIndex = elevators.indexOf(elevator);
      elevatorDirections[elevatorIndex] = "down";
    };

    const setState = (elevator, state) => {
      const elevatorIndex = elevators.indexOf(elevator);
      elevatorStates[elevatorIndex] = state;
    }

    const getState = (elevator) => {
      const elevatorIndex = elevators.indexOf(elevator);
      return elevatorStates[elevatorIndex];
    }

    const removeFloorFromQueue = (queue, floorNum) => {
      let index = queue.indexOf(floorNum);
      if (index > -1) {
        queue.splice(index, 1);
      }
    };

    const visitFloor = (elevator, floor) => {
      elevator.goToFloor(floor);
      if (isGoingUp(elevator)) {
        removeFloorFromQueue(upFloorsToVisit, floor);
      }
      if (isGoingDown(elevator)) {
        removeFloorFromQueue(downFloorsToVisit, floor);
      }
      setState(elevator, "busy");
    };

    const findMinimum = (listToUse, filter) => {
      let minFloor = 999;
      for (let floor of listToUse) {
        if (filter(floor) && floor < minFloor) {
          minFloor = floor;
        }
      }
      if (minFloor < 999) {
        return minFloor;
      }
      return -1;
    };

    const findMaximum = (listToUse, filter) => {
      let maxFloor = -1;
      for (let floor of listToUse) {
        if (filter(floor) && floor > maxFloor) {
          maxFloor = floor;
        }
      }
      if (maxFloor > -1) {
        return maxFloor;
      }
      return -1;
    };

    const findFloor = (elevator, goingUp, upFilter, downFilter) => {
      let listToUse = elevator.getPressedFloors();
      if (elevator.loadFactor() < 0.75) {
        listToUse = listToUse.concat(goingUp ? upFloorsToVisit : downFloorsToVisit);
      }

      if (goingUp) {
        return findMinimum(listToUse, upFilter);
      } else {
        return findMaximum(listToUse, downFilter);
      }
    };

    const findFloorMoving = (elevator, goingUp) => {
      const currentFloor = elevator.currentFloor();
      return findFloor(
        elevator,
        goingUp,
        (floor) => (floor > currentFloor),
        (floor) => (floor < currentFloor)
      );
    };

    const findFloorStopped = (elevator, goingUp) => {
      return findFloor(
        elevator,
        goingUp,
        (floor) => true,
        (floor) => true
      );
    };

    const findFloorToVisit = (elevator) => {
      if (getState(elevator) !== "idle") {
        return -1;
      }

      let upFloor = findFloorMoving(elevator, true);
      let downFloor = findFloorMoving(elevator, false);
      if (isGoingUp(elevator) && upFloor >= 0) {
        return upFloor;
      }
      if (isGoingDown(elevator) && downFloor >= 0) {
        return downFloor;
      }

      upFloor = findFloorStopped(elevator, true);
      downFloor = findFloorStopped(elevator, false);

      if (isGoingDown(elevator)) {
        if (upFloor >= 0) {
          goUp(elevator);
          return upFloor;
        }
        if (downFloor >= 0) {
          return downFloor;
        }
      } else {
        if (downFloor >= 0) {
          goDown(elevator);
          return downFloor;
        }
        if (upFloor >= 0) {
          return upFloor;
        }
      }
    };

    const validateQueues = () => {
      const updatedUpQueue = [];
      const updatedDownQueue = [];
      for (let floor of upFloorsToVisit) {
        if (floors[floor].buttonStates.up === 'activated' && !updatedUpQueue.includes(floor)) {
          updatedUpQueue.push(floor);
        }
      }
      for (let floor of downFloorsToVisit) {
        if (floors[floor].buttonStates.down === 'activated' && !updatedDownQueue.includes(floor)) {
          updatedDownQueue.push(floor);
        }
      }
      upFloorsToVisit = updatedUpQueue;
      downFloorsToVisit = updatedDownQueue;
    }

    const goToFloors = (elevator) => {
      validateQueues();
      const floorToVisit = findFloorToVisit(elevator);
      if (floorToVisit >= 0) {
        visitFloor(elevator, floorToVisit);
        return;
      }
    };

    const updateElevators = () => {
      const sortedElevators = elevators.concat([]).sort((elevator) => (
        elevator.loadFactor()
      ));
      for (let elevator of sortedElevators) {
        goToFloors(elevator);
      }
    }

    for (let floor of floors) {
      const level = floor.floorNum();
      floor.on("up_button_pressed", () => {
        upFloorsToVisit.push(level);
        updateElevators();
      });
      floor.on("down_button_pressed", () => {
        downFloorsToVisit.push(level);
        updateElevators();
      });
    }

    for (let elevator of elevators) {
      elevator.on("idle", () => {
        setState(elevator, "idle");
        updateElevators();
      });
      elevatorStates.push("idle");
      elevatorDirections.push("up");
    }
  },
  update: function(dt, elevators, floors) {
    // Don't do anything
  }
}
