import { assign, createMachine, Sender } from "xstate";

export interface SimpleDataFetchMachineContext {
  data?: Data;
  errorMessage?: string;
}

interface Variables {
  page: number;
}

interface Data {
  name: string;
}

export type SimpleDataFetchMachineEvent =
  | {
      type: "FETCH";
      variables: Variables;
    }
  | {
      type: "RECEIVE_DATA";
      data: Data;
      totalPages: number;
    }
  | {
      type: "CANCEL";
    };

const simpleDataFetchMachine = createMachine<
  SimpleDataFetchMachineContext,
  SimpleDataFetchMachineEvent
>(
  {
    id: "simpleDataFetch",
    initial: "fetching",
    states: {
      idle: {
        on: {
          FETCH: {
            target: "fetching"
          }
        },
        initial: "noError",
        states: {
          noError: {
            entry: ["clearErrorMessage"]
          },
          errored: {}
        }
      },
      fetching: {
        on: {
          FETCH: {
            target: "fetching"
          },
          CANCEL: {
            target: "idle"
          },
          RECEIVE_DATA: {
            target: "idle",
            actions: ["assignDataToContext", "updatePaginationTotalPages"]
          }
        },
        invoke: {
          src: "fetchData",
          onError: {
            target: "idle.errored",
            actions: "assignErrorToContext"
          }
        }
      }
    }
  },
  {
    services: {
      fetchData: () => (send: Sender<SimpleDataFetchMachineEvent>) => {
        setTimeout(() => {
          send({
            type: "RECEIVE_DATA",
            data: {
              name: "Hey"
            },
            totalPages: 20
          });
        }, 800);
      }
    },
    actions: {
      assignDataToContext: assign((context, event) => {
        if (event.type !== "RECEIVE_DATA") return {};
        return {
          data: event.data
        };
      }),
      clearErrorMessage: assign({
        errorMessage: undefined
      }),
      assignErrorToContext: assign((context, event: any) => {
        return {
          errorMessage: event.data?.message || "An unknown error occurred"
        };
      })
    }
  }
);

export default simpleDataFetchMachine;
